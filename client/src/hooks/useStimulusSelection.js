import { useEffect, useMemo, useState } from "react";
import { STIMULUS_GROUPS } from "../lib/categories";

function buildItemKey(item) {
  if (!item) {
    return "";
  }

  return [item.word, item.explanation, item.direction].join("::");
}

function findFirstAvailable(result) {
  if (!result) {
    return null;
  }

  for (const group of STIMULUS_GROUPS) {
    const items = result[group.key];

    if (Array.isArray(items) && items.length > 0) {
      return {
        group: group.key,
        index: 0,
        itemKey: buildItemKey(items[0])
      };
    }
  }

  return null;
}

function findSelectionByKey(result, itemKey) {
  if (!result || !itemKey) {
    return null;
  }

  for (const group of STIMULUS_GROUPS) {
    const items = Array.isArray(result[group.key]) ? result[group.key] : [];

    for (let index = 0; index < items.length; index += 1) {
      if (buildItemKey(items[index]) === itemKey) {
        return {
          group: group.key,
          index,
          itemKey
        };
      }
    }
  }

  return null;
}

export function useStimulusSelection(result) {
  const [selection, setSelection] = useState(() => findFirstAvailable(result));

  useEffect(() => {
    const nextDefault = findFirstAvailable(result);

    if (!nextDefault) {
      setSelection(null);
      return;
    }

    setSelection((current) => {
      if (!current?.itemKey) {
        return nextDefault;
      }

      return findSelectionByKey(result, current.itemKey) || nextDefault;
    });
  }, [result]);

  const selectedItem = useMemo(() => {
    if (!selection || !result) {
      return null;
    }

    return result?.[selection.group]?.[selection.index] || null;
  }, [result, selection]);

  const selectItem = (group, index, item) => {
    setSelection({
      group,
      index,
      itemKey: buildItemKey(item)
    });
  };

  return {
    selection,
    selectedItem,
    selectItem
  };
}
