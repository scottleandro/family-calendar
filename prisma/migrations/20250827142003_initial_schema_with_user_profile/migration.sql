-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordExpiresAt" TIMESTAMPTZ(6) NOT NULL,
    "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMPTZ(6) NOT NULL,
    "end" TIMESTAMPTZ(6) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "rrule" TEXT,
    "exdates" TIMESTAMPTZ(6)[],
    "durationMinutes" INTEGER,
    "durationDays" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventTag" (
    "eventId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "EventTag_pkey" PRIMARY KEY ("eventId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "public"."UserProfile"("email");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "public"."UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_passwordExpiresAt_idx" ON "public"."UserProfile"("passwordExpiresAt");

-- CreateIndex
CREATE INDEX "Event_createdBy_idx" ON "public"."Event"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "public"."Tag"("userId", "name");

-- AddForeignKey
ALTER TABLE "public"."EventTag" ADD CONSTRAINT "EventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventTag" ADD CONSTRAINT "EventTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
