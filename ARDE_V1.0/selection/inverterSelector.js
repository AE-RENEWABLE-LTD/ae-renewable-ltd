import { inverters } from "../data/inverters.js";

export function chooseInverter(solarPvRequired){

    const minimum = solarPvRequired;
    const maximum = solarPvRequired * 1.5;

    // One inverter
    const single = inverters
        .filter(inv =>
            inv.maxPvWatt >= minimum &&
            inv.maxPvWatt <= maximum
        )
        .sort((a,b)=>a.maxPvWatt-b.maxPvWatt);

    if(single.length){

        return{
            quantity:1,
            inverter:single[0],
            totalPv:single[0].maxPvWatt
        };

    }

    // Two identical inverters
    let best = null;

    for(const inv of inverters){

        const totalPv = inv.maxPvWatt * 2;

        if(totalPv >= minimum && totalPv <= maximum){

            if(!best || totalPv < best.totalPv){

                best = {
                    quantity:2,
                    inverter:inv,
                    totalPv
                };

            }

        }

    }

    if(best) return best;

    // Three identical inverters
    best = null;

    for(const inv of inverters){

        const totalPv = inv.maxPvWatt * 3;

        if(totalPv >= minimum && totalPv <= maximum){

            if(!best || totalPv < best.totalPv){

                best = {
                    quantity:3,
                    inverter:inv,
                    totalPv
                };

            }

        }

    }

    return best;
}