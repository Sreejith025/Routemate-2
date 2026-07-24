import { useAuthContext } from "../context/AuthContext";

export const useAuthSync = () => {
  return useAuthContext();
};

export default useAuthSync;
