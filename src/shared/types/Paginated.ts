export class Paginated<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(records: T[], total: number, page: number, limit: number) {
    this.records = records;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
