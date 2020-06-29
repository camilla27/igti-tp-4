import express from 'express';
import { accountModel } from '../models/account.js';

const app = express();

app.get('/', async (req, res) => {
  try {
    let account = new accountModel(req.body);
    let balanceBD = await accountModel.find(
      { agencia: account.agencia, conta: account.conta },
      { _id: 0, agencia: 1, conta: 1, name: 1, balance: 1 });

    if (balanceBD.length === 0) {
      res.status(404).send('Conta não existe');
    } else {
      res.send(balanceBD);
    }

  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/deposito', async (req, res) => {
  try {
    let account = new accountModel(req.body);
    let balanceBD = await accountModel.find(
      { agencia: account.agencia, conta: account.conta },
      { _id: 1, balance: 1 });

    if (balanceBD.length === 0) {
      res.status(404).send('Conta não existe');

    } else {
      const deposito = account.balance + balanceBD[0].balance;
      await accountModel.updateMany(
        { _id: balanceBD[0]._id },
        { $set: { balance: deposito } });

      let retornoValor = await accountModel.find(
        { _id: balanceBD[0]._id },
        { _id: 0, balance: 1 });

      res.send(retornoValor);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/saque', async (req, res) => {
  try {
    let account = new accountModel(req.body);
    let balanceBD = await accountModel.find(
      { agencia: account.agencia, conta: account.conta },
      { _id: 1, balance: 1 });

    if (balanceBD.length === 0) {
      res.status(404).send('Conta não existe');
    } else {
      const saque = account.balance + 1;
      if (balanceBD[0].balance < saque) {
        res.status(404).send('Saldo Insuficiente');
      } else {
        const valorAtual = balanceBD[0].balance - saque;
        await accountModel.updateMany(
          { _id: balanceBD[0]._id },
          { $set: { balance: valorAtual } });

        let retornoValor = await accountModel.find(
          { _id: balanceBD[0]._id },
          { _id: 0, balance: 1 });

        res.send(retornoValor);
      }
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/', async (req, res) => {
  try {
    let account = new accountModel(req.body);
    let contaDelete = await accountModel.findOneAndDelete({ agencia: account.agencia, conta: account.conta });

    if (!contaDelete) {
      res.status(404).send('Conta não existe');
    } else {
      let balanceBD = await accountModel.find(
        { agencia: account.agencia },
        { _id: 0, agencia: 1, conta: 1, name: 1, balance: 1 });
      const contas = {
        contasAtivas: balanceBD.length,
        accounts: [balanceBD],
      };
      res.send(contas);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/transaction/:conta', async (req, res) => {
  try {
    let accountBody = new accountModel(req.body);
    let accountParamsOrigem = new accountModel(req.params);

    let contaOrigem = await accountModel.find(
      { conta: accountParamsOrigem.conta },
      { _id: 1, agencia: 1, balance: 1 });
    let contaDestino = await accountModel.find(
      { conta: accountBody.conta },
      { _id: 1, agencia: 1, balance: 1 });


    if (contaOrigem[0].agencia === contaDestino[0].agencia) {
      if (contaOrigem[0].balance < accountBody.balance) {
        res.status(404).send('Saldo insuficiente para transferencia');
      } else {
        const valorAtualContaOrigem = contaOrigem[0].balance - accountBody.balance;
        const valorAtualContaDestino = contaDestino[0].balance + accountBody.balance;

        await accountModel.updateMany(
          { _id: contaOrigem[0]._id },
          { $set: { balance: valorAtualContaOrigem } });

        await accountModel.updateMany(
          { _id: contaDestino[0]._id },
          { $set: { balance: valorAtualContaDestino } });

        let retornoValor = await accountModel.find(
          { _id: contaOrigem[0]._id },
          { _id: 0, agencia: 1, conta: 1, name: 1, balance: 1 });

        res.send(retornoValor);
      }
    }
    else {
      const tarifa = 8;
      if (contaOrigem[0].balance < (accountBody.balance + tarifa)) {
        res.status(404).send('Saldo insuficiente para transferencia');
      } else {

        const valorAtualContaOrigem = contaOrigem[0].balance - accountBody.balance - tarifa;
        const valorAtualContaDestino = contaDestino[0].balance + accountBody.balance;

        console.log(valorAtualContaOrigem)
        console.log(valorAtualContaDestino)

        await accountModel.updateMany(
          { _id: contaOrigem[0]._id },
          { $set: { balance: valorAtualContaOrigem } });

        await accountModel.updateMany(
          { _id: contaDestino[0]._id },
          { $set: { balance: valorAtualContaDestino } });

        let retornoValor = await accountModel.find(
          { _id: contaOrigem[0]._id },
          { _id: 0, agencia: 1, conta: 1, name: 1, balance: 1 });

        res.send(retornoValor);
      }
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/mediasaldo', async (req, res) => {
  try {
    let account = new accountModel(req.body);

    let mediaSaldo = await accountModel.aggregate(
      [{ $match: { agencia: account.agencia } },
      { $group: { _id: "$agencia:", media: { $avg: "$balance" } } }]);

    res.send(mediaSaldo);

  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/listarmenorsaldo/:qtde', async (req, res) => {
  try {
    let qtdeCliente = req.params.qtde;
    let accounts = await accountModel.find({}).sort({ balance: 1 }).limit(parseInt(qtdeCliente));
    console.log(accounts);
    res.send(accounts);

  } catch (error) {
    res.status(500).send(error);
  }
});


app.get('/listarmaiorsaldo/:qtde', async (req, res) => {
  try {
    let qtdeCliente = req.params.qtde;
    let accounts = await accountModel.find({})
      .sort({ balance: -1, name: 1 })
      .limit(parseInt(qtdeCliente));
    res.send(accounts);

  } catch (error) {
    res.status(500).send(error);
  }
});

app.put('/transferir', async (req, res) => {
  try {
    let accountsAg10 = await accountModel.find({ agencia: 10 })
      .sort({ balance: -1 })
      .limit(1);
    let accountsAg25 = await accountModel.find({ agencia: 25 })
      .sort({ balance: -1 })
      .limit(1);
    let accountsAg33 = await accountModel.find({ agencia: 33 })
      .sort({ balance: -1 })
      .limit(1);
    let accountsAg47 = await accountModel.find({ agencia: 47 })
      .sort({ balance: -1 })
      .limit(1);

    await accountModel.updateMany(
      { _id: accountsAg10[0]._id },
      { $set: { agencia: 99 } });

    await accountModel.updateMany(
      { _id: accountsAg25[0]._id },
      { $set: { agencia: 99 } });

    await accountModel.updateMany(
      { _id: accountsAg33[0]._id },
      { $set: { agencia: 99 } });

    await accountModel.updateMany(
      { _id: accountsAg47[0]._id },
      { $set: { agencia: 99 } });

    let agencia99 = await accountModel.find({ agencia: 99 });
    res.send(agencia99);

  } catch (error) {
    res.status(500).send(error);
  }
});

export { app as accountsRouter };