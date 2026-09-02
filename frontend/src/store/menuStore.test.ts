import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMenuStore } from "./menuStore";
import { useMenuAnchor } from "../hooks/useMenuAnchor";

describe("menuStore and useMenuAnchor", () => {
  beforeEach(() => {
    useMenuStore.setState({ activeMenuId: null });
  });

  it("should open and close menus properly in store", () => {
    expect(useMenuStore.getState().activeMenuId).toBeNull();

    useMenuStore.getState().openMenu("menu-a");
    expect(useMenuStore.getState().activeMenuId).toBe("menu-a");
    expect(useMenuStore.getState().isMenuOpen("menu-a")).toBe(true);
    expect(useMenuStore.getState().isMenuOpen("menu-b")).toBe(false);

    useMenuStore.getState().openMenu("menu-b");
    expect(useMenuStore.getState().activeMenuId).toBe("menu-b");
    expect(useMenuStore.getState().isMenuOpen("menu-a")).toBe(false);
    expect(useMenuStore.getState().isMenuOpen("menu-b")).toBe(true);

    useMenuStore.getState().closeMenu("menu-b");
    expect(useMenuStore.getState().activeMenuId).toBeNull();
  });

  it("closeMenu only closes if matching id or no id passed", () => {
    useMenuStore.getState().openMenu("menu-a");
    useMenuStore.getState().closeMenu("menu-b");
    expect(useMenuStore.getState().activeMenuId).toBe("menu-a");

    useMenuStore.getState().closeMenu("menu-a");
    expect(useMenuStore.getState().activeMenuId).toBeNull();
  });

  it("closeAll resets activeMenuId", () => {
    useMenuStore.getState().openMenu("menu-a");
    expect(useMenuStore.getState().activeMenuId).toBe("menu-a");

    useMenuStore.getState().closeAll();
    expect(useMenuStore.getState().activeMenuId).toBeNull();
  });

  it("useMenuAnchor closes other menus when a new menu opens", () => {
    const dummyElement1 = document.createElement("button");
    const dummyElement2 = document.createElement("button");

    const { result: hookA } = renderHook(() => useMenuAnchor("menu-a"));
    const { result: hookB } = renderHook(() => useMenuAnchor("menu-b"));

    expect(hookA.current.isOpen).toBe(false);
    expect(hookB.current.isOpen).toBe(false);

    // Open Menu A
    act(() => {
      hookA.current.handleOpen({
        currentTarget: dummyElement1,
      } as unknown as React.MouseEvent<HTMLElement>);
    });

    expect(hookA.current.isOpen).toBe(true);
    expect(hookA.current.anchorEl).toBe(dummyElement1);
    expect(hookB.current.isOpen).toBe(false);
    expect(hookB.current.anchorEl).toBeNull();

    // Open Menu B -> Menu A should automatically close
    act(() => {
      hookB.current.handleOpen({
        currentTarget: dummyElement2,
      } as unknown as React.MouseEvent<HTMLElement>);
    });

    expect(hookA.current.isOpen).toBe(false);
    expect(hookA.current.anchorEl).toBeNull();
    expect(hookB.current.isOpen).toBe(true);
    expect(hookB.current.anchorEl).toBe(dummyElement2);

    // Close Menu B
    act(() => {
      hookB.current.handleClose();
    });

    expect(hookA.current.isOpen).toBe(false);
    expect(hookB.current.isOpen).toBe(false);
  });
});
