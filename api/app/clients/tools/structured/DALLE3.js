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
    - Maintains the original intent of the description, with parameters for image style, quality, and size to tailor the output.`;
    this.description_for_model =
      DALLE3_SYSTEM_PROMPT ??
      `// Whenever a description of an image is given, generate prompt (following these rules), All prompts sent to dalle must abide by the following policies:
    // 1. Prompts must be in English. Translate to English if needed.
    // 2. DO NOT list or refer to the descriptions before OR after generating the images. They should ONLY ever be written out ONCE, in the \`"prompts"\` field of the request. You do not need to ask for permission to generate, just do it!
    // 4. Always end any prompt with the extension "--v 6" to make sure that you use version 6 of the model midjurney.
    // 5. You have the ability to create images by analyzing other images from URLs. If the description has a URL for an image, put it between "<>" at the start before the description that comes with the URL.
    // 6. DO NOT say what you will do , Just do it directly (Just generate the images directly).
    // 7. If the user reference a previous image, you should start your prompt with "[gen_id]" from the image metadata.
    // All descriptions sent to dalle should be a paragraph of text. Each should be more than 5 words long.
    // MAKE SURE that the end result is the same given description prompt (language and grammer fixed) with 2-5 parameters after it, then end with the arguments "--v 6", and make sure you didn't add any new items to the image or change the wanted mean of it, You will get 4 images (not 2 images or 1 image) so make sure you know that
    // If the description written in English, Send it directly to dalle without any modifications at all, Also if there's missing spaces after or before "," DON'T add them, The only modification you have to do all the times is adding "--v 6" at the end, if the description have the word "Upscale" add the argument "--upscale" at the end too, you can also use the argument "--ar 16:9" to create landscape images or "--ar 4:7" to create mobile background images (or any other ratio after --ar ), Make sure you use the same written description if it's written in English.
    // Basic Parameters, The next is 17 basic parameters you must use at least 2 or 3 of them for each prompt based on the description, Add them at the end of the prompt (if the description has parameters don't do this step):
    // 1. Aspect Ratios
    // --aspect, or --ar Change the aspect ratio of a generation.
    // Common Midjourney Aspect Ratios
    // --aspect 1:1 Default aspect ratio.
    // --aspect 5:4 Common frame and print ratio.
    // --aspect 3:2 Common in print photography.
    // --aspect 7:4 Close to HD TV screens and smartphone screens.
    // 2. Chaos
    // --chaos <number 0-100> Change how varied the results will be. Higher values produce more unusual and unexpected generations.
    // 3. Fast
    // --fast override your current setting and run a single job using Fast Mode.
    // 4. Image Weight
    // --iw <0-2> Sets image prompt weight relative to text weight. The default value is 1.
    // 5. No
    // --no Negative prompting, [--no plants] would try to remove plants from the image use it to delete anything from the image, Larger values are rounded down to 1.
    // 6. Quality
    // --quality <.25, .5, or 1>, or --q <.25, .5, or 1> How much rendering quality time you want to spend. The default value is 1. Higher values use more GPU minutes; lower values use less.
    // 7. Random
    // --style random, add a random 32 base styles Style Tuner code to your prompt. You can also use --style random-16, --style random-64 or --style random-128 to use random results from other lengths of Style Tuners.
    // 8. Relax
    //--relax override your current setting and run a single job using Relax Mode.
    // 9. Repeat
    // --repeat <1-40>, or --r <1-40> Create multiple Jobs from a single prompt. --repeat is useful for quickly rerunning a job multiple times.
    // 10. Seed
    // --seed <integer between 0-4294967295> The Midjourney bot uses a seed number to create a field of visual noise, like television static, as a starting point to generate the initial image grids. Seed numbers are generated randomly for each image but can be specified with the --seed or --sameseed parameter. Using the same seed number and prompt will produce similar ending images (IMPORTANT NOTE).
    // 11. Stop
    // --stop <integer between 10-100> Use the --stop parameter to finish a Job partway through the process. Stopping a Job at an earlier percentage can create blurrier, less detailed results.
    // 12. Style
    // --style <raw> Switch between versions of the Midjourney Model Version 5.1 and 5.2.
    // --style <4a, 4b, or 4c> Switch between versions of the Midjourney Model Version 4.
    // --style <cute, expressive, original, or scenic> Switch between versions of the Niji Model Version 5.
    // 13. Stylize
    // --stylize <number>, or --s <number> parameter influences how strongly Midjourney's default aesthetic style is applied to Jobs.
    // 14. Tile
    // --tile parameter generates images that can be used as repeating tiles to create seamless patterns, if the user need to use tile (repeating pattern) you should switch to version 5.2 "--v 5.2".
    // 15. Turbo
    // --turbo override your current setting and run a single job using Turbo Mode.
    // 16. Weird
    // --weird <number 0-3000>, or --w <number 0-3000> Explore unusual aesthetics with the experimental --weird parameter.
    // 17. Niji
    // --niji 5 An alternative model focused on anime-style images.`;
    this.schema = z.object({
      prompt: z
        .string()
        .max(4000)
        .describe(
          'A given description of the desired image, add short enhance descriptions after it, make sure you end the prompt with "--v 6".',
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
    const models = ['midjourney', 'dall-e-3', 'kandinsky-3'];
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

    const imageUrls = resp.data.map(image => image.url);

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
