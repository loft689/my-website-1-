import { Star } from "lucide-react";

export const StarRating = ({ value = 0, size = 16 }) => {
  return (
    <div className="flex items-center gap-0.5" data-testid={`star-rating-${value}`}>
      {[1,2,3,4,5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= value ? "fill-[#FF2D75] text-[#FF2D75]" : "text-zinc-700"}
        />
      ))}
    </div>
  );
};
