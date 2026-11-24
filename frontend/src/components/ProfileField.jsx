export default function ProfileField({ label, name, value, onChange, multiline = false, type = "text", help }) {
  const Control = multiline ? "textarea" : "input";

  return (
    <label className="profile-field">
      <span>{label}</span>
      <Control
        name={name}
        type={multiline ? undefined : type}
        value={value ?? ""}
        onChange={onChange}
        rows={multiline ? 4 : undefined}
      />
      {help && <small>{help}</small>}
    </label>
  );
}
