import { useEffect, useMemo, useState } from "react";
import { STIMULUS_GROUPS } from "../lib/categories";

function findFirstAvailable(result) {
  if (!result) {
    return null;
  }

  for (const group of STIMULUS_GROUPS) {
    const items = result[group.key];

    if (Array.isArray(items) && items.length > 0) {
      return { group: group.key, index: 0 };
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
      if (!current) {
        return nextDefault;
      }

      const currentItems = result?.[current.group];

      if (!currentItems?.[current.index]) {
        return nextDefault;
      }

      return current;
    });
  }, [result]);

  const selectedItem = useMemo(() => {
    if (!selection || !result) {
      return null;
    }

    return result?.[selection.group]?.[selection.index] || null;
  }, [result, selection]);

  const selectItem = (group, index) => {
    setSelection({ group, index });
  };

  return {
    selection,
    selectedItem,
    selectItem
  };
}
