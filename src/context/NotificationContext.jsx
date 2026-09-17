import {
  createContext,
  useCallback,
  useContext,
  useState
} from 'react';

const NotificationContext = createContext(null);

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({
  children
}) {
  const [notifications, setNotifications] =
    useState([]);

  const notify = useCallback(
    (
      message,
      type = 'success'
    ) => {
      const id =
        Date.now() +
        Math.random();

      setNotifications(
        (current) => [
          ...current,
          {
            id,
            message,
            type
          }
        ]
      );

      window.setTimeout(() => {
        setNotifications(
          (current) =>
            current.filter(
              (item) =>
                item.id !== id
            )
        );
      }, 4000);
    },
    []
  );

  const removeNotification = (
    id
  ) => {
    setNotifications(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notify
      }}
    >
      {children}

      <div className="fixed top-5 right-5 z-[9999] w-full max-w-sm space-y-3 px-4 sm:px-0">
        {notifications.map(
          (notification) => {
            const styles =
              notification.type ===
              'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : notification.type ===
                    'warning'
                  ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                  : notification.type ===
                      'info'
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-green-200 bg-green-50 text-green-700';

            return (
              <div
                key={
                  notification.id
                }
                className={`rounded-2xl border px-4 py-4 shadow-xl ${styles}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">
                      {notification.type ===
                      'error'
                        ? 'Error'
                        : notification.type ===
                            'warning'
                          ? 'Warning'
                          : notification.type ===
                              'info'
                            ? 'Information'
                            : 'Success'}
                    </p>

                    <p className="text-sm mt-1">
                      {
                        notification.message
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    className="font-black text-lg"
                    onClick={() =>
                      removeNotification(
                        notification.id
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>
    </NotificationContext.Provider>
  );
}