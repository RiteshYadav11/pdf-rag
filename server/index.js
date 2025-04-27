import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { CohereEmbeddings } from "@langchain/cohere";
import { QdrantVectorStore } from '@langchain/qdrant';
import { CohereClientV2 } from "cohere-ai";
// import { ChatCohere } from '@langchain/cohere';

const queue = new Queue('file-upload-queue',{ connection : {
    host: 'localhost',
    port: '6379'
  },
});
const client = new CohereClientV2({
  token: "S8RbVgHk6otVJnbH5QVDTMrxFtdSrkltoLVYKLFo"
});

// const client = new ChatCohere({
//   model: "command-r-plus",
//   token: "S8RbVgHk6otVJnbH5QVDTMrxFtdSrkltoLVYKLFo"
// });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });


const app = express();
app.use(cors());

app.get('/', (req, res) => {
    return res.json({status: 'All Good!'});
});

app.post('/upload/pdf' , upload.single('pdf'), async (req,res)=>{
    await queue.add('file-ready', JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    }))
    return res.json({message: 'uploaded'});
})

app.get('/chat' , async (req , res) => {
  const userQuery = "what is this rPPG";
  const embeddings = new CohereEmbeddings({
        apiKey: "S8RbVgHk6otVJnbH5QVDTMrxFtdSrkltoLVYKLFo", // In Node.js defaults to process.env.COHERE_API_KEY
        batchSize: 48, // Default value if omitted is 48. Max value is 96
        model: "embed-english-v3.0",
      });
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'langchainjs-testing',
      }
  );
  const ret = vectorStore.asRetriever(1);
  const result = await ret.invoke(userQuery);

  const SYSTEM_PROMPT = `
  You are an Helpfull AI Assistant who answeres the user query based on the available context from the pdf File.
  Context:
  ${JSON.stringify(result)}
  `

  const chatResult = await client.chat({
    model: 'command-a-03-2025',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },{
        role:'user',
        content:userQuery
      },
    ],
  });

  return res.json({ 
    message: chatResult.message.content[0].text, 
    docs: result });
})

app.listen(8000, () => console.log(`Server started on PORT:${8000}`));