export function calculatePV(load,losses,psh,batteryWh){

    const loadEff= load/0.8;

    return (batteryWh/psh)+loadEff;

}