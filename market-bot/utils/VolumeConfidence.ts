export const calculateVolumeConfidence = (ohlcData: any) => {
    const volumes = Object.values(ohlcData).map((data: any) => parseInt(data['5. volume']));
    const averageVolume = volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);
    const volumeConfidence = averageVolume / maxVolume;
    return volumeConfidence;
};