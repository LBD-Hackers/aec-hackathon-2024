import { FragmentMap } from "bim-fragment";
import { FragmentIdMap } from "openbim-components";

// The only difference between the two is the datatype of the set of expressIds which is a string in FragmentIdMap and number in FragmentMap
export function fragmentMapToFragmentIdMap(fragmentMap: FragmentMap): FragmentIdMap{
    const fragmentIdMap: FragmentIdMap = {};
    Object.keys(fragmentMap).forEach(fragmentId => {
        const expressIds: Set<string> = new Set();
        fragmentMap[fragmentId].forEach(id => expressIds.add(id.toString()));
        fragmentIdMap[fragmentId] = expressIds;
    });
    return fragmentIdMap;
}

// The only difference between the two is the datatype of the set of expressIds which is a string in FragmentIdMap and number in FragmentMap
export function fragmentIdMapToFragmentMap(fragmentIdMap: FragmentIdMap): FragmentMap{
    const fragmentMap: FragmentMap = {};
    Object.keys(fragmentIdMap).forEach(fragmentId => {
        const expressIds: Set<number> = new Set();
        fragmentIdMap[fragmentId].forEach(id => expressIds.add(parseInt(id)));
        fragmentMap[fragmentId] = expressIds;
    });
    return fragmentMap;
}