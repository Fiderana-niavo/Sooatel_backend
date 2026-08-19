
import { DataSource } from "typeorm";
import AppDataSource from "./database/data-source";
import { Purchase } from "./database/Entities/Purchase";
import { PurchaseDetail } from "./database/Entities/PurchaseDetail";
import { PurchaseDelivery } from "./database/Entities/PurchaseDelivery";
import { ProductDelivery } from "./database/Entities/ProductDelivery";
import { DeliveryDetail } from "./database/Entities/DeliveryDetail";

async function run() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const refs = ["ACH0006", "ACH0008"];
    const purchases = await queryRunner.manager.createQueryBuilder(Purchase, "purchase")
      .where("purchase.ref IN (:...refs)", { refs })
      .getMany();

    if (purchases.length === 0) {
      console.log("No purchases found with refs: ", refs);
      return;
    }

    const purchaseIds = purchases.map(p => p.idPurchase);
    console.log("Found purchases:", purchases.map(p => p.ref).join(", "));

    await queryRunner.manager.createQueryBuilder().delete().from(PurchaseDetail).where("id_purchase IN (:...purchaseIds)", { purchaseIds }).execute();
    console.log("Deleted purchase details");

    const purchaseDeliveries = await queryRunner.manager.createQueryBuilder(PurchaseDelivery, "pd")
      .where("pd.id_purchase IN (:...purchaseIds)", { purchaseIds })
      .getMany();
    
    if (purchaseDeliveries.length > 0) {
        const deliveryIds = purchaseDeliveries.map(pd => pd.idDelivery);
        console.log("Found deliveries:", deliveryIds.length);
        
        // delete ALL purchase deliveries for these deliveries so there is no foreign key issue
        await queryRunner.manager.createQueryBuilder().delete().from(PurchaseDelivery).where("id_delivery IN (:...deliveryIds)", { deliveryIds }).execute();
        await queryRunner.manager.createQueryBuilder().delete().from(DeliveryDetail).where("id_delivery IN (:...deliveryIds)", { deliveryIds }).execute();
        await queryRunner.manager.createQueryBuilder().delete().from(ProductDelivery).where("id_delivery IN (:...deliveryIds)", { deliveryIds }).execute();
        console.log("Deleted deliveries");
    }

    await queryRunner.manager.createQueryBuilder().delete().from(Purchase).where("id_purchase IN (:...purchaseIds)", { purchaseIds }).execute();
    console.log("Deleted purchases");

    await queryRunner.commitTransaction();
    console.log("Done!");
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error:", error);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

run();

