import { FragmentIdMap } from "openbim-components";

export function mergeFragmentIdMaps(fragmentIdMaps: FragmentIdMap[]): FragmentIdMap{
    const mergedMap: FragmentIdMap = {};
    fragmentIdMaps.forEach(fragmentIdMap => {
        Object.keys(fragmentIdMap).forEach(fragmentId => {
            if(mergedMap[fragmentId] === undefined){
                mergedMap[fragmentId] = fragmentIdMap[fragmentId];
            }else{
                mergedMap[fragmentId] = new Set([...mergedMap[fragmentId], ...fragmentIdMap[fragmentId]])
            }
        });
    });
    return mergedMap;
}