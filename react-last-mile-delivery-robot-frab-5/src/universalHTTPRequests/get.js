import { db } from "../Firebase/Firebase";

// Subscribe to Realtime Database and return the matching cleanup function.
export default function universalFetch(
  setResponse,
  endpoint,
  onError,
  onSuccess
) {
  const reference = db.ref(endpoint);
  setResponse({
    data: null,
    loading: true,
    error: null,
  });
  const onValue = (snapshot) => {
    setResponse({ data: snapshot.val(), loading: false, error: null });
    onSuccess && onSuccess(snapshot);
  };
  const onFailure = (error) => {
    setResponse({ data: null, loading: false, error });
    onError && onError(error);
  };
  reference.on("value", onValue, onFailure);
  return () => reference.off("value", onValue);
}
