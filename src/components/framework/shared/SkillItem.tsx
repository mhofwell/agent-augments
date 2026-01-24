import type { FrameworkSkill } from "@/types/database";

interface SkillItemProps {
  skill: FrameworkSkill;
  isLast?: boolean;
}

export function SkillItem({ skill, isLast = false }: SkillItemProps) {
  return (
    <div className="flex">
      {/* ASCII tree connector */}
      <div className="flex-shrink-0 w-6 flex flex-col items-center select-none">
        <span className="font-mono text-sm leading-none text-zinc-700">
          {isLast ? "└" : "├"}
        </span>
        {!isLast && (
          <div className="flex-1 w-px bg-zinc-800/50" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2 pl-2">
        <div className="text-sm text-zinc-300">
          {skill.name}
        </div>
      </div>
    </div>
  );
}
