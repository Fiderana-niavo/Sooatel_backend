import AppDataSource from "../../../database/data-source";
import { SupplierProduct } from "../../../database/Entities/SupplierProduct";
import { SupplierProductPrice } from "../../../database/Entities/SupplierProductPrice";
import { LessThanOrEqual } from "typeorm";
import { scheduleDailyAtMidnight } from "../../../shared/jobs/cron.util";

async function updatePendingPrices(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const priceRepo = AppDataSource.getRepository(SupplierProductPrice);
    const productRepo = AppDataSource.getRepository(SupplierProduct);

    const products = await productRepo.find();
    let updatedCount = 0;

    for (const product of products) {
      const latestPrice = await priceRepo.findOne({
        where: {
          idSupplierProduct: product.idSupplierProduct,
          changeDate: LessThanOrEqual(today)
        },
        order: { changeDate: "DESC" },
      });

      if (latestPrice && Number(latestPrice.price) !== Number(product.actualPrice)) {
        await productRepo.update(product.idSupplierProduct, { actualPrice: latestPrice.price });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`[SupplierPriceJob] Mis à jour des prix pour ${updatedCount} produit(s) fournisseur.`);
    }
  } catch (err) {
    console.error("[SupplierPriceJob] Erreur lors de la mise à jour des prix fournisseurs :", err);
  }
}

export function startSupplierPriceJob(): void {
  scheduleDailyAtMidnight("SupplierPriceJob", updatePendingPrices);
}
