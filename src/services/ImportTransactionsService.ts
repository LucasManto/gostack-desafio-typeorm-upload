import fs from 'fs';
import csv from 'csvtojson';

import CreateTransactionService from './CreateTransactionService';

interface Request {
  file_path: string;
}

interface Response {
  id: string;
  title: string;
  value: number;
  type: string;
  category: string;
}

class ImportTransactionsService {
  async execute({ file_path }: Request): Promise<Response[]> {
    const createTransaction = new CreateTransactionService();

    const transactionsData = await csv().fromFile(file_path);

    await fs.promises.unlink(file_path);

    const transactions: Response[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const transactionData of transactionsData) {
      const { title, type, value, category } = transactionData;

      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransaction.execute({
        title,
        type,
        value: Number.parseFloat(value),
        category,
      });

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
