import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

interface Response {
  id: string;
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: category_title,
  }: Request): Promise<Response> {
    if (!title || title === '') {
      throw new AppError('Transaction title must not be empty.');
    }

    if (!value || value <= 0) {
      throw new AppError('Transaction value must be greater than zero (0).');
    }

    if (!type || (type !== 'income' && type !== 'outcome')) {
      throw new AppError('Transaction type must be "income" or "outcome".');
    }

    if (!category_title || category_title === '') {
      throw new AppError('Transaction category must not be empty');
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (value > total) {
        throw new AppError('Transaction not allowed. You do not have funds');
      }
    }

    const categoriesRepository = getRepository(Category);
    let category = await categoriesRepository.findOne({
      where: { title: category_title },
    });

    if (!category) {
      category = categoriesRepository.create({
        title: category_title,
      });

      await categoriesRepository.save(category);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);

    return {
      id: transaction.id,
      title: transaction.title,
      value: transaction.value,
      type: transaction.type,
      category: category.title,
    };
  }
}

export default CreateTransactionService;
