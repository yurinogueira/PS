import { useState, useCallback, useEffect } from "react";
import { useMenuStore } from "../store/menuStore";

export function useMenuAnchor(menuId: string) {
  const activeMenuId = useMenuStore((state) => state.activeMenuId);
  const openMenu = useMenuStore((state) => state.openMenu);
  const closeMenu = useMenuStore((state) => state.closeMenu);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isOpen = activeMenuId === menuId && Boolean(anchorEl);

  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
      openMenu(menuId);
    },
    [menuId, openMenu],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    closeMenu(menuId);
  }, [menuId, closeMenu]);

  useEffect(() => {
    if (activeMenuId !== menuId && anchorEl !== null) {
      setAnchorEl(null);
    }
  }, [activeMenuId, menuId, anchorEl]);

  return {
    anchorEl,
    isOpen,
    handleOpen,
    handleClose,
    setAnchorEl,
  };
}
