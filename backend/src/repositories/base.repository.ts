import { Types, UpdateQuery, Model, Document } from 'mongoose';

// Simple filter type for mongoose queries
type SimpleFilter = Record<string, unknown>;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateObjectId(id: string, fieldName: string = 'id'): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError(`INVALID_${fieldName.toUpperCase().replace(/\s/g, '_')}`);
  }
}

export function validateObjectIdOptional(
  id: string | undefined | null,
  fieldName: string = 'id'
): void {
  if (id !== undefined && id !== null && !Types.ObjectId.isValid(id)) {
    throw new ValidationError(`INVALID_${fieldName.toUpperCase().replace(/\s/g, '_')}`);
  }
}

export function toObjectId(id: string): Types.ObjectId {
  validateObjectId(id);
  return new Types.ObjectId(id);
}

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  protected validateId(id: string, fieldName: string = 'id'): void {
    validateObjectId(id, fieldName);
  }

  async findById(id: string): Promise<T | null> {
    this.validateId(id);
    return this.model.findById(id).exec();
  }

  async findByIdLean(id: string): Promise<T | null> {
    this.validateId(id);
    return this.model.findById(id).lean().exec();
  }

  async findOne(filter: SimpleFilter): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async find(filter: SimpleFilter = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async findLean(filter: SimpleFilter = {}): Promise<T[]> {
    return this.model.find(filter).lean().exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    this.validateId(id);
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    this.validateId(id);
    return this.model.findByIdAndDelete(id).exec();
  }

  async exists(filter: SimpleFilter): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async count(filter: SimpleFilter = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
