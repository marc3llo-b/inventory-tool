export const Progress = ({ value }: { value: number }) => (
  <div className="w-full bg-gray-200 rounded">
    <div
      className="bg-green-500 h-2 rounded"
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

