import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItem from "../../../../domain/checkout/entity/order_item";

export default class OrderRepository implements OrderRepositoryInterface {
    async create(entity: Order): Promise<void> {
        await OrderModel.create(
            {
                id: entity.id,
                customer_id: entity.customerId,
                total: entity.total(),
                items: entity.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
            },
            {
                include: [{model: OrderItemModel}],
            }
        );
    }

    async find(id: string): Promise<Order> {
        const orderModel = await OrderModel.findOne({
            where: {id},
            include: ["items"],
        })
        const orderItems = orderModel?.items?.map((item) => {
            return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity)
        });
        return new Order(orderModel.id, orderModel.customer_id, orderItems)
    }

    async findAll(): Promise<Order[]> {
        const ordersModel = await OrderModel.findAll();
        return ordersModel.map((order) => {
            const orderItems = order.items.map((item) => {
                return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity)
            });
            return new Order(order.id, order.customer_id, orderItems)
        })
    }

    async update(entity: Order): Promise<any> {
        return await OrderModel.update({
            total: entity.total(),
            items: entity.items.map((item: OrderItem) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                product_id: item.productId,
                quantity: item.quantity,
            }))
        }, {
            where: {
                id: entity.id,
                customer_id: entity.customerId,
            }
        });
    }
}
