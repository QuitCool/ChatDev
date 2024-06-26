// From https://platform.openai.com/docs/guides/images/usage?context=node
// To use this tool, you must pass in a configured OpenAIApi object.
const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const OpenAI = require('openai');
const { Tool } = require('langchain/tools');
const { HttpsProxyAgent } = require('https-proxy-agent');
const saveImageFromUrl = require('../saveImageFromUrl');
const extractBaseURL = require('../../../../utils/extractBaseURL');
const { DALLE3_SYSTEM_PROMPT, MIDJ_REVERSE_PROXY, PROXY } = process.env;
class DALLE3 extends Tool {
  constructor(fields = {}) {
    super();

    let apiKey = fields.MIDJ_API_KEY || this.getApiKey();
    const config = { apiKey };
    if (MIDJ_REVERSE_PROXY) {
      config.baseURL = extractBaseURL(MIDJ_REVERSE_PROXY);
    }

    if (PROXY) {
      config.httpAgent = new HttpsProxyAgent(PROXY);
    }

    this.openai = new OpenAI(config);
    this.name = 'dalle';
    this.description = `Use DALLE to create images from text descriptions.
    - It requires prompts to be in English, detailed, and to specify image type and human features for diversity.
    - Create only one image, without repeating or listing descriptions outside the "prompts" field.
    - Maintains the original intent of the description, with parameters for image style, quality, and size to tailor the output.`;
    this.description_for_model =
      DALLE3_SYSTEM_PROMPT ??
      `// Prompts must be in English. Translate to English if needed.
      // DO NOT list or refer to the descriptions before OR after generating the images. They should ONLY ever be written out ONCE, in the \`"prompts"\` field of the request. You do not need to ask for permission to use tools, just do it!. Don't say that you can't interact with URLs.
      // You may get 4 images, SHOW ALL FOUR.
      // You have the capability to interact with URLs by sending them through your request to dalle at the first, example: <URL> description --ar num:num --v 6 .
      // I'll give you a few shot example of the desired prompt shape '<URL HERE IF PROVIDED> THE SAME USER DESCRIPTION --ar num:num `;
    this.schema = z.object({
      prompt: z
        .string()
        .max(4000)
        .describe(
          'A given description of the desired image, add the parameters (--ar num:num) after it, make sure you end the prompt with "--v 6 --fast".',
        ),
    });
  }

  getApiKey() {
    const apiKey = process.env.MIDJ_API_KEY || '';
    if (!apiKey) {
      throw new Error('Missing MIDJ_API_KEY environment variable.');
    }
    return apiKey;
  }

  replaceUnwantedChars(inputString) {
    return inputString
      .replace(/\r\n|\r|\n/g, ' ')
      .replace(/"/g, '')
      .trim();
  }

  getMarkdownImageUrl(imageName) {
    const imageUrl = path
      .join(this.relativeImageUrl, imageName)
      .replace(/\\/g, '/')
      .replace('public/', '');
    return `![generated image](/${imageUrl})`;
  }

  async _call(data) {
    const { prompt } = data;
    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    let resp;
    const models = ['midjourney', 'playground-v2.5'];
    for (const model of models) {
      try {
        resp = await this.openai.images.generate({
          model,
          prompt: this.replaceUnwantedChars(prompt),
          n: 4,
        });
        break; // If the image generation is successful, break out of the loop
      } catch (error) {
        if (models.indexOf(model) === models.length - 1) {
          // If this is the last model in the array and it still fails, return the error
          return `Something went wrong when trying to generate the image. The API may be unavailable:
Error Message: ${error.message}`;
        }
        // If the current model fails, continue to the next one
        console.error(`Model ${model} failed: ${error.message}`);
      }
    }

    if (!resp) {
      return 'Something went wrong when trying to generate the image. The API may unavailable';
    }

    const imageUrls = resp.data.map((image) => image.url);

    if (!imageUrls.length) {
      return 'No image URL returned from OpenAI API. There may be a problem with the API or your configuration.';
    }

    const regex = /[\w\d]+\.png/;
    let imageNames = [];

    imageUrls.forEach((imageUrl, index) => {
      const match = imageUrl.match(regex);
      if (match) {
        imageNames.push(match[0]);
        console.log(`Image ${index + 1} name:`, match[0]);
      } else {
        console.log(`No image name found in the string for image ${index + 1}.`);
      }
    });

    this.outputPath = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'client',
      'public',
      'images',
    );
    const appRoot = path.resolve(__dirname, '..', '..', '..', '..', '..', 'client');
    this.relativeImageUrl = path.relative(appRoot, this.outputPath);

    // Check if directory exists, if not create it
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    let markdownImageUrls = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        await saveImageFromUrl(imageUrls[i], this.outputPath, imageNames[i]);
        markdownImageUrls.push(this.getMarkdownImageUrl(imageNames[i]));
      } catch (error) {
        console.error(`Error while saving image ${i + 1}:`, error);
        markdownImageUrls.push(imageUrls[i]);
      }
    }

    return markdownImageUrls.join('\n');
  }
}

module.exports = DALLE3;
