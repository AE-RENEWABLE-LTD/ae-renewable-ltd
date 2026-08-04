export function calculateBattery(dailyEnergy,dod,batteryPercent){

    return ((dailyEnergy / 0.8)*(batteryPercent/100));

}


// BATTERY.JS