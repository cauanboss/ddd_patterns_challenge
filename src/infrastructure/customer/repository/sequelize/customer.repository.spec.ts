import {Sequelize} from "sequelize-typescript";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import CustomerModel from "./customer.model";
import CustomerRepository from "./customer.repository";
import EventDispatcher from "../../../../domain/@shared/event/event-dispatcher";
import SendEmailWhenProductIsCreatedHandler
    from "../../../../domain/product/event/handler/send-email-when-product-is-created.handler";
import EnviaConsoleLogHandler from "../../../../domain/customer/event/handler/envia-console-log-handler";
import CustomerChangeAddressEvent from "../../../../domain/customer/event/customer-changed-address";
import CustomerCreatedEvent from "../../../../domain/customer/event/customer-created.event";
import EnviaConsoleLog1Handler from "../../../../domain/customer/event/handler/envia-console-log-1-handler";
import EnviaConsoleLog2Handler from "../../../../domain/customer/event/handler/envia-console-log-2-handler";

describe("Customer repository test", () => {
    let sequelize: Sequelize;

    beforeEach(async () => {
        sequelize = new Sequelize({
            dialect: "sqlite",
            storage: ":memory:",
            logging: false,
            sync: {force: true},
        });

        await sequelize.addModels([CustomerModel]);
        await sequelize.sync();
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it("should create a customer", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.Address = address;
        await customerRepository.create(customer);

        const customerModel = await CustomerModel.findOne({where: {id: "123"}});

        expect(customerModel.toJSON()).toStrictEqual({
            id: "123",
            name: customer.name,
            active: customer.isActive(),
            rewardPoints: customer.rewardPoints,
            street: address.street,
            number: address.number,
            zipcode: address.zip,
            city: address.city,
        });
    });

    it("should update a customer", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.Address = address;
        await customerRepository.create(customer);

        customer.changeName("Customer 2");
        await customerRepository.update(customer);
        const customerModel = await CustomerModel.findOne({where: {id: "123"}});

        expect(customerModel.toJSON()).toStrictEqual({
            id: customer.id,
            name: customer.name,
            active: customer.isActive(),
            rewardPoints: customer.rewardPoints,
            street: address.street,
            number: address.number,
            zipcode: address.zip,
            city: address.city,
        });
    });

    it("should find a customer", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.Address = address;
        await customerRepository.create(customer);

        const customerResult = await customerRepository.find(customer.id);

        expect(customer).toStrictEqual(customerResult);
    });

    it("should throw an error when customer is not found", async () => {
        const customerRepository = new CustomerRepository();

        expect(async () => {
            await customerRepository.find("456ABC");
        }).rejects.toThrow("Customer not found");
    });

    it("should find all customers", async () => {
        const customerRepository = new CustomerRepository();
        const customer1 = new Customer("123", "Customer 1");
        const address1 = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer1.Address = address1;
        customer1.addRewardPoints(10);
        customer1.activate();

        const customer2 = new Customer("456", "Customer 2");
        const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
        customer2.Address = address2;
        customer2.addRewardPoints(20);

        await customerRepository.create(customer1);
        await customerRepository.create(customer2);

        const customers = await customerRepository.findAll();

        expect(customers).toHaveLength(2);
        expect(customers).toContainEqual(customer1);
        expect(customers).toContainEqual(customer2);
    });

    it("should create a customer and dispatch an event", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.Address = address;
        await customerRepository.create(customer);

        const eventDispatcher = new EventDispatcher();

        const eventHandler1 = new EnviaConsoleLog1Handler();
        const spyEventHandler1 = jest.spyOn(eventHandler1, "handle");
        eventDispatcher.register("CustomerCreatedEvent", eventHandler1);

        const eventHandler2 = new EnviaConsoleLog2Handler();
        const spyEventHandler2 = jest.spyOn(eventHandler2, "handle");
        eventDispatcher.register("CustomerCreatedEvent", eventHandler2);


        eventDispatcher.notify(new CustomerCreatedEvent({
            id: customer.id,
            name: customer.name,
            address: `${address.street}, ${address.number}, ${address.zip}, ${address.city}`,
        }));

        expect(spyEventHandler1).toHaveBeenCalled();
        expect(spyEventHandler2).toHaveBeenCalled();

        const customerModel = await CustomerModel.findOne({where: {id: "123"}});

        expect(customerModel.toJSON()).toStrictEqual({
            id: "123",
            name: customer.name,
            active: customer.isActive(),
            rewardPoints: customer.rewardPoints,
            street: address.street,
            number: address.number,
            zipcode: address.zip,
            city: address.city,
        });

        eventDispatcher.unregister("CustomerCreatedEvent", eventHandler1);
        eventDispatcher.unregister("CustomerCreatedEvent", eventHandler2);

        expect(eventDispatcher.getEventHandler("CustomerCreatedEvent")).toEqual([]);
    });

    it("should edit a customer address and dispatch an event", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.Address = address;
        await customerRepository.create(customer);

        const customerModel = await CustomerModel.findOne({where: {id: "123"}});
        expect(customerModel.toJSON()).toStrictEqual({
            id: "123",
            name: customer.name,
            active: customer.isActive(),
            rewardPoints: customer.rewardPoints,
            street: address.street,
            number: address.number,
            zipcode: address.zip,
            city: address.city,
        });

        customer.changeAddress(new Address("Street 2", 2, "Zipcode 2", "City 2"));
        await customerRepository.update(customer);

        const eventDispatcher = new EventDispatcher();
        const eventHandler = new EnviaConsoleLogHandler();
        eventDispatcher.register("CustomerChangedAddressEvent", eventHandler);

        const spyEventHandler = jest.spyOn(eventHandler, "handle");
        eventDispatcher.notify(new CustomerChangeAddressEvent({
            id: customer.id,
            name: customer.name,
            address: "Street 2, 2, Zipcode 2, City 2",
        }));

        const customerModelUpdated = await CustomerModel.findOne({where: {id: "123"}});
        expect(customerModelUpdated.toJSON()).toStrictEqual({
            id: "123",
            name: customer.name,
            active: customer.isActive(),
            rewardPoints: customer.rewardPoints,
            street: "Street 2",
            number: 2,
            zipcode: "Zipcode 2",
            city: "City 2",
        });
    });
});
