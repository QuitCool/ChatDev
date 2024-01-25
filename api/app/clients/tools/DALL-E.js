// From https://platform.openai.com/docs/guides/images/usage?context=node
// To use this tool, you must pass in a configured OpenAIApi object.
const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const OpenAI = require('openai');
const { Tool } = require('langchain/tools');
const { HttpsProxyAgent } = require('https-proxy-agent');
const saveImageFromUrl = require('./saveImageFromUrl');
const extractBaseURL = require('../../../utils/extractBaseURL');
const { DALLE3_SYSTEM_PROMPT, DALLE_REVERSE_PROXY, PROXY } = process.env;
class OpenAICreateImage extends Tool {
  constructor(fields = {}) {
    super();

    let apiKey = fields.DALLE_API_KEY || this.getApiKey();
    const config = { apiKey };
    if (DALLE_REVERSE_PROXY) {
      config.baseURL = extractBaseURL(DALLE_REVERSE_PROXY);
    }

    if (PROXY) {
      config.httpAgent = new HttpsProxyAgent(PROXY);
    }

    this.openai = new OpenAI(config);
    this.name = 'dall-e';
    this.description = `Use DALLE to create images from text descriptions.
    - It requires prompts to be in English, detailed, and to specify image type and human features for diversity.
    - I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS.
    - Create only one image, without repeating or listing descriptions outside the "prompts" field.
    - Maintains the original intent of the description, with parameters for image style, quality, and size to tailor the output.`;
    this.description_for_model =
      DALLE3_SYSTEM_PROMPT ??
      `// Whenever a description of an image is given, generate prompts (following these rules), and use dalle to create the image. If the user does not ask for a specific number of images, default to creating 2 prompts to send to dalle that are written to be as diverse as possible. All prompts sent to dalle must abide by the following policies:
    // 1. Prompts must be in English. Translate to English if needed.
    // 2. One image per function call. Create only 1 image per request unless explicitly told to generate more than 1 image.
    // 3. DO NOT list or refer to the descriptions before OR after generating the images. They should ONLY ever be written out ONCE, in the \`"prompts"\` field of the request. You do not need to ask for permission to generate, just do it!
    // 4. Always mention the image type (photo, oil painting, watercolor painting, illustration, cartoon, drawing, vector, render, etc.) at the beginning of the caption. Unless the captions suggests otherwise, make one of the images a photo.
    // 5. Diversify depictions of ALL images with people to always include always DESCENT and GENDER for EACH person using direct terms. Adjust only human descriptions.
    // - EXPLICITLY specify these attributes, not abstractly reference them. The attributes should be specified in a minimal way and should directly describe their physical form.
    // - Your choices should be grounded in reality. For example, all of a given OCCUPATION should not be the same gender or race. Additionally, focus on creating diverse, inclusive, and exploratory scenes via the properties you choose during rewrites.  Make choices that may be insightful or unique sometimes.
    // - Use "various" or "diverse" ONLY IF the description refers to groups of more than 3 people. Do not change the number of people requested in the original description.
    // - Don't alter memes, fictional character origins, or unseen people. Maintain the original prompt's intent and prioritize quality.
    // The prompt must intricately describe every part of the image in concrete, objective detail. THINK about what the end goal of the description is, and extrapolate that to what would make satisfying images, If the goal of the image is 'logo' as the style, make sure you write/draw the text prompt on the middle of the LOGO.
    // I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS. DO NOT DELETE any of the description details, ADD 3 short descruptions (2 words each) at the end of the prompt to detail the image.`;
    this.schema = z.object({
      prompt: z
        .string()
        .max(4000)
        .describe(
          'A text description of the desired image, following the rules.',
        ),
      size: z
      .enum(['1024x1024', '1792x1024', '1024x1792'])
      .describe(
        'The size of the requested image. Use 1024x1024 (square) as the default, 1792x1024 if the user requests a wide or landscape image, and 1024x1792 for full-body portraits. Always include this parameter in the request.',
      ),
    });
  }

  getApiKey() {
    const apiKey = process.env.DALLE_API_KEY || '';
    if (!apiKey) {
      throw new Error('Missing DALLE_API_KEY environment variable.');
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
    const { prompt, size = '1024x1024' } = data;
    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    let resp;
    const models = ['dall-e-3', 'kandinsky-3'];
    for (const model of models) {
      try {
        resp = await this.openai.images.generate({
          model,
          prompt: this.replaceUnwantedChars(prompt),
          n: 1,
          size,
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

    const theImageUrl = resp.data[0].url;

    if (!theImageUrl) {
      return 'No image URL returned from OpenAI API. There may be a problem with the API or your configuration.';
    }

    const regex = /[\w\d]+.png/;
    const match = theImageUrl.match(regex);
    let imageName = '1.png';

    if (match) {
      imageName = match[0];
      console.log(imageName); // Output: img-lgCf7ppcbhqQrz6a5ear6FOb.png
    } else {
      console.log('No image name found in the string.');
    }

    this.outputPath = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'client',
      'public',
      'images',
    );
    const appRoot = path.resolve(__dirname, '..', '..', '..', '..', 'client');
    this.relativeImageUrl = path.relative(appRoot, this.outputPath);

    // Check if directory exists, if not create it
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    try {
      await saveImageFromUrl(theImageUrl, this.outputPath, imageName);
      this.result = this.getMarkdownImageUrl(imageName);
    } catch (error) {
      console.error('Error while saving the image:', error);
      this.result = theImageUrl;
    }

    return this.result;
  }
}

module.exports = OpenAICreateImage;