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
const { DALLE3_SYSTEM_PROMPT, DALLE_REVERSE_PROXY, PROXY } = process.env;
class DALLE3 extends Tool {
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
    this.name = 'dalle';
    this.description = `Use DALLE to create images from text descriptions.
    - It requires prompts to be in English, detailed, and to specify image type and human features for diversity.
    - Create only one image, without repeating or listing descriptions outside the "prompts" field.
    - Maintains the original intent of the description, with parameters for image style, quality, and size to tailor the output.
    - if you recived 4 images, provide them on the UI in raw, one after one, etc.`;
    this.schema = z.object({
      prompt: z
        .string()
        .max(4000)
        .describe(
          'A text fixation of the desired image, return the text grammerly fixed at the same length, your prompt for generating 4 images for model called Midjourney V6.',
        ),
      count: z
      .enum(['4', '8'])
      .describe(
        'The default number of images to generate on midjourney is 4 or the multiply of 4. provide each image alone.'
      ),
    });
  }

  getApiKey() {
    const apiKey = process.env.DALLE_API_KEY || '';
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
    const models = ['midjourney', 'kandinsky-3', 'sdxl'];
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

module.exports = DALLE3;
