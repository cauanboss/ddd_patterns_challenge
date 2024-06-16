import EventInterface from "../../@shared/event/event.interface";

export default class CustomerChangedAddressEvent implements EventInterface {
    dataTimeOccurred: Date;
    eventData: any;

    constructor(eventData: any) {
        this.dataTimeOccurred = new Date();
        this.eventData = eventData;
    }

    get id(): number {
        return this.eventData.id;
    }

    get name(): string {
        return this.eventData.name;
    }

    get address(): string {
        return this.eventData.address;
    }
}