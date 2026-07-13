export function calculateBattery(dailyEnergy,dod,batteryPercent){

    return (dailyEnergy*(batteryPercent/100))/dod;

}