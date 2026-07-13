export function calculatePV(load,losses,psh,batteryWh){

    const loadEff=load/losses;

    return (batteryWh/psh)+loadEff;

}