import express from 'express';
import mongoose from 'mongoose';
import { accountsRouter } from './routes/accountsRouter.js'

//conexão com o banco
(async () => {
  try {
    mongoose.connect("mongodb+srv://admin:admin@cluster0-dxgx7.mongodb.net/bank?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Conectou ao banco MongoDB");
  } catch (error) {
    console.log("Erro ao conectar no MongoDB")
  }
})();

const app = express();
app.use(express.json());
app.use('/account', accountsRouter);
app.listen(3000, () => console.log('API Iniciada'));