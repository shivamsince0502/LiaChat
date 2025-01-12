import Together from 'together-ai';

import dotenv from 'dotenv';
dotenv.config();


const togetherClient = new Together({
  apiKey: process.env.TOGETHER_AI_KEY 
});


export default togetherClient;
