DO $$ BEGIN
CREATE TYPE "public"."college_request_status" AS ENUM('Pending', 'Approved', 'Rejected');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."course" AS ENUM('BTech', 'BE', 'BCA', 'BSc', 'BArch (Nitte DU)', 'MCA', 'MTech');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."event_audience" AS ENUM('Participants', 'Non-Participants', 'Both');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."event_status" AS ENUM('Draft', 'Published', 'Ongoing', 'Completed');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."event_type" AS ENUM('Solo', 'Team');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."gender" AS ENUM('Male', 'Female', 'Prefer Not To Say');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."payment_status" AS ENUM('Pending', 'Paid', 'Refunded');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."state" AS ENUM('Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttarakhand', 'Uttar Pradesh', 'West Bengal', 'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli', 'Lakshadweep Islands');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."team_progress" AS ENUM('WINNER', 'RUNNER', 'SECOND_RUNNER', 'TRACK', 'PARTICIPATION');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TYPE "public"."team_status" AS ENUM('Not Selected', 'Under Review', 'Selected', 'Rejected', 'Winner', 'Runner Up', 'Second Runner Up');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint