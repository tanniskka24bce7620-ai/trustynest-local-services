import { useEffect, useRef } from "react";

/** Request browser notification permission and show notifications for incoming messages when tab is not focused */
export function useChatNotifications() {
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    if (!("Notification" in window)) return;
    permissionRef.current = Notification.permission;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        permissionRef.current = p;
      });
    }
  }, []);

  const notify = (title: string, body: string) => {
    if (document.hasFocus()) return;
    if (permissionRef.current !== "granted") return;
    try {
      const n = new Notification(title, {
        body,
        icon: "/servnest-logo.png",
        tag: "servnest-chat",
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      // Silent fail on unsupported platforms
    }
  };

  return { notify };
}
