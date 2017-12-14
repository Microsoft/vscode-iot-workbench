
namespace IoTStudio {
    export class IoTProject 
    {
        private componentList: Component[];

        private addComponent(comp : Component){
        }

        private canProvision(comp: any): comp is Provisionable {
            return (comp as Provisionable).provision !== undefined;
         }

        constructor () {
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

        provision() :boolean {
            for (let item of this.componentList) {
                if(this.canProvision(item)){
                    // TODO: provision each component
                }         
            }

            return true;
        }

        deploy() :boolean {
            return true;
        }

        setDeviceConnectionString(deviceConnectionString: string) :boolean {
            return true;
        }
    }
}