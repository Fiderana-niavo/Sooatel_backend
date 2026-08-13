import AppDataSource from "../../../database/data-source";
import { Purchase } from "../../../database/Entities/Purchase";
import { PurchaseDetail } from "../../../database/Entities/PurchaseDetail";
import { SuppliedItem } from "../../../database/Entities/SuppliedItem";
import { PURCHASE_STATUS } from "../constants/purchase.constants";
import { PurchaseDto } from "../type/purchase.type";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import { Paginated } from "../../../shared/types/Paginated";
import { getPurchaseStatusName } from "../constants/purchase.constants";

export class PurchaseService {
  async createPurchase(dto: PurchaseDto, userId: string): Promise<any> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchase = new Purchase();

      purchase.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : new Date();
      purchase.status = PURCHASE_STATUS.CREATED;
      purchase.idSupplier = dto.idSupplier;
      purchase.idPurchaser = dto.idPurchaser || userId;

      const savedPurchase = await queryRunner.manager.save(Purchase, purchase);

      let calculatedTotal = 0;
      const detailsToInsert = [];

      if (dto.details && dto.details.length > 0) {
        for (const detailDto of dto.details) {
          if (detailDto.quantity < 1) throw new BadRequestError(`La quantité doit être au moins 1.`);
          if (detailDto.unitPrice < 0) throw new BadRequestError(`Le prix unitaire ne peut pas être négatif.`);

          const suppliedItem = await queryRunner.manager.findOne(SuppliedItem, { where: { idSuppliedItem: detailDto.idSuppliedItem } });
          if (!suppliedItem) throw new NotFoundError(`Article fournisseur ${detailDto.idSuppliedItem} introuvable`);

          const lineTotal = detailDto.quantity * detailDto.unitPrice;
          calculatedTotal += lineTotal;
          detailsToInsert.push({
            idPurchase: savedPurchase.idPurchase,
            idSuppliedItem: detailDto.idSuppliedItem,
            quantity: detailDto.quantity,
            unitPrice: detailDto.unitPrice,
            totalAmount: lineTotal
          });
        }

        if (detailsToInsert.length > 0) {
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(PurchaseDetail)
            .values(detailsToInsert)
            .execute();
        }
      }

      savedPurchase.totalAmount = calculatedTotal;
      savedPurchase.balanceDue = calculatedTotal;
      await queryRunner.manager.save(Purchase, savedPurchase);

      await queryRunner.commitTransaction();

      return {
        ...savedPurchase,
        status: getPurchaseStatusName(savedPurchase.status)
      } as any;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(options: { 
    page?: number; 
    limit?: number; 
    status?: number; 
    idSupplier?: string; 
    startDate?: string; 
    endDate?: string 
  } = {}): Promise<Paginated<any>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const repository = AppDataSource.getRepository(Purchase);

    const qb = repository
      .createQueryBuilder("purchase")
      .select([
        "purchase.idPurchase",
        "purchase.ref",
        "purchase.purchaseDate",
        "purchase.totalAmount",
        "purchase.balanceDue",
        "purchase.status",
        "purchase.idSupplier",
        "purchase.idPurchaser"
      ])
      .leftJoin("purchase.supplier", "supplier")
      .addSelect(["supplier.idSupplier", "supplier.name"])
      .orderBy("purchase.purchaseDate", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (options.status !== undefined) {
      qb.andWhere("purchase.status = :status", { status: options.status });
    }

    if (options.idSupplier) {
      qb.andWhere("purchase.idSupplier = :idSupplier", { idSupplier: options.idSupplier });
    }

    if (options.startDate) {
      qb.andWhere("purchase.purchaseDate >= :startDate", { startDate: options.startDate });
    }

    if (options.endDate) {
      qb.andWhere("purchase.purchaseDate <= :endDate", { endDate: options.endDate });
    }

    const [records, total] = await qb.getManyAndCount();

    const mappedRecords = records.map((record) => ({
      ...record,
      status: getPurchaseStatusName(record.status)
    }));

    return {
      records: mappedRecords,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  async getPurchaseById(idPurchase: string): Promise<any | null> {
    const purchase = await Purchase.findOne({
      where: { idPurchase },
      select: {
        idPurchase: true,
        ref: true,
        purchaseDate: true,
        totalAmount: true,
        balanceDue: true,
        status: true,
        idSupplier: true,
        idPurchaser: true,
        supplier: {
          idSupplier: true,
          name: true
        },
        purchaser: {
          idEmployee: true,
          name: true,
          lastname: true
        }
      },
      relations: {
        supplier: true,
        purchaser: true,
      }
    });

    if (!purchase) return null;

    return {
      ...purchase,
      status: getPurchaseStatusName(purchase.status)
    };
  }

  async getPurchaseDetails(idPurchase: string): Promise<PurchaseDetail[]> {
    return PurchaseDetail.find({
      where: { idPurchase },
      select: {
        idPurchaseDetail: true,
        idPurchase: true,
        idSuppliedItem: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        suppliedItem: {
          idSuppliedItem: true,
          item: {
            idItem: true,
            label: true,
            ref: true
          },
          supplierProduct: {
            idSupplierProduct: true,
            name: true,
            actualPrice: true
          }
        }
      },
      relations: {
        suppliedItem: {
          item: true,
          supplierProduct: true
        }
      }
    });
  }
}
