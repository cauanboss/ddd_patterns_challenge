import {Sequelize} from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";
import {json} from "sequelize";

describe("Order repository test", () => {
    let sequelize: Sequelize;

    beforeEach(async () => {
        sequelize = new Sequelize({
            dialect: "sqlite",
            storage: ":memory:",
            logging: false,
            sync: {force: true},
        });

        await sequelize.addModels([
            CustomerModel,
            OrderModel,
            OrderItemModel,
            ProductModel,
        ]);
        await sequelize.sync();
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it("should create a new order", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("123", "Product 1", 10);
        await productRepository.create(product);

        const orderItem = new OrderItem(
            "1",
            product.name,
            product.price,
            product.id,
            2
        );

        const order = new Order("123", "123", [orderItem]);

        const orderRepository = new OrderRepository();
        await orderRepository.create(order);

        const orderModel = await OrderModel.findOne({
            where: {id: order.id},
            include: ["items"],
        });

        expect(orderModel.toJSON()).toStrictEqual({
            id: "123",
            customer_id: "123",
            total: order.total(),
            items: [
                {
                    id: orderItem.id,
                    name: orderItem.name,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    order_id: "123",
                    product_id: "123",
                },
            ],
        });
    });

    it("should update a order", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product1 = new Product("123", "Product 1", 10);
        await productRepository.create(product1);

        const orderItem1 = new OrderItem(
            "1",
            product1.name,
            product1.price,
            product1.id,
            2
        );

        const order1 = new Order("123", "123", [orderItem1]);
        const orderRepository = new OrderRepository();
        await orderRepository.create(order1);

        await OrderItemModel.update({
            id: "123",
            name: "Teste 2",
            price: orderItem1.price,
            productId: orderItem1.productId,
            quantity: orderItem1.quantity
        }, {where: {id: orderItem1.id, product_id: product1.id}})

        const orderItemModel = await OrderItemModel.findOne({where:{id: "123"}})


        const orderItem2 = new OrderItem(
            orderItemModel.id,
            orderItemModel.name,
            orderItemModel.price,
            orderItemModel.id,
            orderItemModel.quantity
        );


        const order2 = new Order("123", "123", [orderItem2]);
        const updated = await orderRepository.update(order2);
        expect(updated).toEqual([1]);

        const orderModel = await OrderModel.findOne({
            where: {id: "123"},
            include: ["items"],
        });

        expect(orderModel.toJSON()).toEqual({
            id: order1.id,
            customer_id: order1.customerId,
            total: order1.total(),
            items: [
                {
                    id: order2.id,
                    name: orderItem2.name,
                    price: orderItem2.price,
                    quantity: orderItem2.quantity,
                    order_id: order2.id,
                    product_id: orderItem2.productId,
                },
            ],
        });
    });
});
