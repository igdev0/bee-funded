import "./styles.css";

export interface AvatarProps {
  imageUrl: string;
}

export default function Avatar({imageUrl}: AvatarProps) {
  return (
      <div className="avatar">
        <img src={imageUrl} alt="Avatar" draggable={false}/>
      </div>
  );
}