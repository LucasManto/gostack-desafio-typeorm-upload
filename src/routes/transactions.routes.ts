import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = (
    await transactionsRepository.find({
      select: ['id', 'title', 'value', 'type'],
      relations: ['category'],
    })
  ).map(transaction => {
    const { id, title, value, type, category } = transaction;

    return {
      id,
      title,
      value,
      type,
      category: {
        id: category.id,
        title: category.title,
      },
    };
  });

  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute({ id });

  return response.json();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const { file } = request;

    const importTransactions = new ImportTransactionsService();
    const transactions = await importTransactions.execute({
      file_path: file.path,
    });

    return response.json(transactions);

    // const transactionsRepository = getCustomRepository(TransactionsRepository);

    // const transactions = await transactionsRepository.find();

    // return response.json(transactions);
  },
);

export default transactionsRouter;
