namespace IoTStudio {
    export class AZ3166Device implements Deivce
    {
        private deviceType: DeviceType;
        private componentType : ComponentType;

        constructor () {
            this.deviceType = DeviceType.MXChip_AZ3166;
            this.componentType = ComponentType.Device;
        }
        
        getDeviceType() : DeviceType {
            return this.deviceType;
        }

        getComponentType(): ComponentType{
            return this.componentType;
        }

        load(folderPath: string): boolean{
            return true;
        }

        save(folderPath: string): boolean{
            return true;
        }

        compile() :boolean {
            return true;
        }

        upload() :boolean {
            return true;
        }
    }
}