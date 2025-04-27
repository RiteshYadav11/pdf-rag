// import { Worker } from 'bullmq';
// import { OpenAIEmbeddings } from "@langchain/openai";
// import { QdrantVectorStore } from "@langchain/qdrant";
// import { Document } from "@langchain/core/documents";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { CharacterTextSplitter } from "@langchain/textsplitters";


// const worker = new Worker('file-upload-queue', async (job) => {
//   console.log(`Job:`, job.data);
//   const data = JSON.parse(job.data);
//   /*
//   Path: data.path
//   read the pdf from path,
//   chunk the pdf,
//   call teh openai embedding model for every chunk,
//   store the chunk in qdrant db
//   */


// //   Load the pdf
//   const loader = new PDFLoader(data.path);
//   const docs = await loader.load();
//   // console.log('DOCS:',docs);

//   const embeddings = new OpenAIEmbeddings({
//   });

//   const vectorStore = await QdrantVectorStore.fromDocuments(embeddings, {
//     url: 'http://localhost:6333',
//     collectionName: "langchainjs-testing",
//     collectionConfig: {
//       vectors: {
//         size: 1536, // OpenAI embeddings dimension
//         distance: "Cosine",
//       },
//     },
//   });

//   await vectorStore.addDocuments(docs);
//   console.log("All docs are added to vector store")

//     // const textSplitter = new CharacterTextSplitter({
//     //     chunkSize: 300,
//     //     chunkOverlap: 0,
//     //   });
//     //   const texts = await textSplitter.splitText(docs);
//     //   console.log(texts);

//   },
//   { concurrency: 100 , connection : {
//     host: 'localhost',
//     port: '6379'
//   },
// }
// );


import { Worker } from 'bullmq';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { CohereEmbeddings } from "@langchain/cohere";
import dotenv from 'dotenv'

dotenv.config();

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    console.log(`Job:`, job.data);
    const data = JSON.parse(job.data);
    /*
    Path: data.path
    read the pdf from path,
    chunk the pdf,
    call the openai embedding model for every chunk,
    store the chunk in qdrant db
    */

    // Load the PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();
    console.log("First Done")
    const embeddings = new CohereEmbeddings({
      // apiKey: "", // In Node.js defaults to process.env.COHERE_API_KEY
      apiKey : process.env.COHERE_API_KEY,
      batchSize: 48, // Default value if omitted is 48. Max value is 96
      model: "embed-english-v3.0",
    });
    console.log("Second Done")
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'langchainjs-testing',
      }
    );
    await vectorStore.addDocuments(docs);
    console.log(`All docs are added to vector store`);
  },
  {
    concurrency: 100,
    connection: {
      host: 'localhost',
      port: '6379',
    },
  }
);