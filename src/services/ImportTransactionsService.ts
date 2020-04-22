import fs from 'fs';
import csv from 'csvtojson';
import { getCustomRepository, getRepository, In } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  file_path: string;
}

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Response {
  id: string;
  title: string;
  value: number;
  type: string;
  category: string;
}

class ImportTransactionsService {
  async execute({ file_path }: Request): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const transactionsData = await csv().fromFile(file_path);

    await fs.promises.unlink(file_path);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    transactionsData.forEach(transactionData => {
      const { title, type, value, category } = transactionData;

      if (!title || !type || !value) {
        return;
      }

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    const existingCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });
    const existingCategoriesTitles = existingCategories.map(
      category => category.title,
    );
    const categoriesToInclude = categories
      .filter(category => !existingCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriesToInclude.map(title => ({ title })),
    );
    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existingCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
