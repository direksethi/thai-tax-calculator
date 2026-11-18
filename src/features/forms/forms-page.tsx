import { ArrowSquareOutIcon, FilePdfIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { PageHeader } from "@/components/site/page-header"
import { Segmented } from "@/components/tax/segmented"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AUDIENCES, FORMS, ONLINE_SERVICES, type FormAudience, type TaxForm } from "@/data/forms"
import { useLang, type Lang } from "@/lib/i18n"

type Filter = FormAudience | "all"

export function FormsPage() {
  const lang = useLang()
  const [filter, setFilter] = useState<Filter>("all")
  const [open, setOpen] = useState<TaxForm | null>(null)

  const groups = AUDIENCES.filter((a) => filter === "all" || a.id === filter).map((a) => ({
    ...a,
    forms: FORMS.filter((f) => f.audience === a.id),
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <PageHeader
        eyebrow={lang === "en" ? "Official forms" : "แบบฟอร์มทางการ"}
        title={lang === "en" ? "Forms and deadlines" : "แบบฟอร์มและกำหนดยื่น"}
        description={
          lang === "en"
            ? "Every return, attachment and certificate a person or a small company deals with, linked to the official PDF."
            : "แบบแสดงรายการ ใบแนบ และหนังสือรับรองที่บุคคลธรรมดาและบริษัทขนาดเล็กต้องใช้ พร้อมลิงก์ไฟล์ PDF ทางการ"
        }
      />

      <div className="sticky top-14 z-20 -mx-4 mb-6 bg-background/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 md:top-14">
        <Segmented<Filter>
          size="sm"
          aria-label={lang === "en" ? "Filter forms" : "กรองแบบฟอร์ม"}
          value={filter}
          onChange={setFilter}
          options={[{ value: "all", label: lang === "en" ? "All" : "ทั้งหมด" }, ...AUDIENCES.map((a) => ({ value: a.id, label: a.label[lang] }))]}
        />
      </div>

      <div className="flex flex-col gap-14">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`g-${group.id}`} className="flex flex-col gap-4">
            <h2 id={`g-${group.id}`} className="text-[13px] font-medium text-muted-foreground">
              {group.label[lang]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.forms.map((form) => (
                <FormCard key={form.id} form={form} lang={lang} onPreview={() => setOpen(form)} />
              ))}
            </div>
          </section>
        ))}

        <section className="flex flex-col gap-4">
          <h2 className="text-[13px] font-medium text-muted-foreground">{lang === "en" ? "Online services" : "บริการออนไลน์"}</h2>
          <div className="sheet divide-y divide-border">
            {ONLINE_SERVICES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium">{s.name[lang]}</span>
                  <span className="text-[13px] text-muted-foreground">{s.note[lang]}</span>
                </span>
                <ArrowSquareOutIcon className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </a>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-h-[92svh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          {open ? (
            <>
              <div className="flex items-baseline gap-3 border-b border-border px-5 py-4 pr-14">
                <DialogTitle className="text-[15px] font-semibold">{open.code[lang]}</DialogTitle>
                <span className="truncate text-[13px] text-muted-foreground">{open.name[lang]}</span>
              </div>
              <div className="flex max-h-[calc(92svh-8rem)] flex-col gap-4 overflow-y-auto bg-muted/60 p-4 sm:p-6">
                {open.pages.map((page, i) => (
                  <img
                    key={page}
                    src={`/forms/${page}`}
                    alt={`${open.code[lang]} ${lang === "en" ? "page" : "หน้า"} ${i + 1}`}
                    className="mx-auto w-full max-w-2xl rounded-sm bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)]"
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border px-5 py-3.5 text-[13px]">
                <FormLinks form={open} lang={lang} />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FormCard({ form, lang, onPreview }: { form: TaxForm; lang: Lang; onPreview: () => void }) {
  return (
    <article className="sheet flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={onPreview}
        className="group relative block h-40 overflow-hidden border-b border-border bg-muted/50 text-left"
        aria-label={`${lang === "en" ? "Preview" : "ดูตัวอย่าง"} ${form.code[lang]}`}
      >
        <img
          src={`/forms/${form.pages[0]}`}
          alt=""
          loading="lazy"
          className="absolute inset-x-6 top-5 w-[calc(100%-3rem)] rounded-[3px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_4px_14px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1"
        />
        {form.pages.length > 1 ? (
          <span className="num absolute right-3 bottom-3 rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] text-muted-foreground shadow-sm">
            {form.pages.length} {lang === "en" ? "pages" : "หน้า"}
          </span>
        ) : null}
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{form.code[lang]}</h3>
          <p className="text-[13px] leading-snug text-muted-foreground">{form.name[lang]}</p>
        </div>
        <dl className="flex flex-col gap-2.5 text-[13px] leading-relaxed">
          <div>
            <dt className="text-[11.5px] font-medium text-muted-foreground">{lang === "en" ? "Who files" : "ผู้ยื่น"}</dt>
            <dd>{form.who[lang]}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-medium text-muted-foreground">{lang === "en" ? "When" : "กำหนดเวลา"}</dt>
            <dd>{form.when[lang]}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-medium text-muted-foreground">{lang === "en" ? "Covers" : "รายการ"}</dt>
            <dd>{form.covers[lang]}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-[13px]">
          <FormLinks form={form} lang={lang} />
        </div>
      </div>
    </article>
  )
}

function FormLinks({ form, lang }: { form: TaxForm; lang: Lang }) {
  const agency = form.agency === "SSO" ? "SSO" : form.agency === "DBD" ? "DBD" : lang === "en" ? "RD" : "กรมสรรพากร"
  return (
    <>
      <a href={form.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-ink underline-offset-4 hover:underline">
        <FilePdfIcon className="size-4" />
        {lang === "en" ? `Download from ${agency}` : `ดาวน์โหลดจาก${agency === "กรมสรรพากร" ? "" : " "}${agency}`}
      </a>
      {form.instructions ? (
        <a href={form.instructions} target="_blank" rel="noreferrer" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {lang === "en" ? "Instructions" : "คำแนะนำการกรอก"}
        </a>
      ) : null}
      {form.english ? (
        <a href={form.english} target="_blank" rel="noreferrer" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {lang === "en" ? "English version" : "ฉบับภาษาอังกฤษ"}
        </a>
      ) : null}
    </>
  )
}
