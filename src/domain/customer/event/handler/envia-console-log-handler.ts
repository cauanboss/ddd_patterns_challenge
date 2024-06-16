import CustomerChangeAddressEvent from "../customer-changed-address";
import EventHandlerInterface from "../../../@shared/event/event-handler.interface";

export default class EnviaConsoleLogHandler
    implements EventHandlerInterface<CustomerChangeAddressEvent> {
    handle(event: CustomerChangeAddressEvent): void {
        console.log(`Endereço do cliente: ${event.id}, ${event.name} alterado para: ${event.address}`);
    }
}