function createTick(){
    const date = new Date();
    const epochOffset = 621355968000000000;
    const ticksPerMillisecond = 10000;
  
    const ticks =
      date.getTime() * ticksPerMillisecond + epochOffset;
  
    const str = ticks.toString();
    return str;
}


export default createTick;

//638381676787291640
//638405102075590000