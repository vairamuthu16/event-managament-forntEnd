import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ============================================================
  // LOAD USER FROM LOCAL STORAGE
  // ============================================================

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem('user');

      const token =
        localStorage.getItem('token');

      if (storedUser && token) {
        const parsedUser =
          JSON.parse(storedUser);

        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error(
        'Failed to restore authentication:',
        error
      );

      localStorage.removeItem('user');
      localStorage.removeItem('token');

      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = (data) => {
    if (!data?.token || !data?.user) {
      console.error(
        'Invalid login response:',
        data
      );

      return false;
    }

    localStorage.setItem(
      'token',
      data.token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return true;
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
  };

  // ============================================================
  // REFRESH AUTH USER
  // ============================================================

  const refreshUser = () => {
    try {
      const storedUser =
        localStorage.getItem('user');

      const token =
        localStorage.getItem('token');

      if (!storedUser || !token) {
        setUser(null);
        return;
      }

      const parsedUser =
        JSON.parse(storedUser);

      setUser(parsedUser);
    } catch (error) {
      console.error(
        'Failed to refresh authentication:',
        error
      );

      setUser(null);
    }
  };

  // ============================================================
  // HANDLE STORAGE CHANGES
  // ============================================================

  useEffect(() => {
    const handleStorage =
      () => {
        refreshUser();
      };

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, []);

  // ============================================================
  // CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        authLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}