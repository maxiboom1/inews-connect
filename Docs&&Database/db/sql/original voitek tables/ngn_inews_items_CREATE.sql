USE [NewsArts]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[ngn_inews_items](
	[uid] [bigint] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](256) NOT NULL,
	[lastupdate] [bigint] NOT NULL,
	[production] [bigint] NOT NULL,
	[rundown] [bigint] NOT NULL,
	[story] [bigint] NOT NULL,
	[ord] [int] NOT NULL,
	[ordupdate] [bigint] NOT NULL,
	[template] [bigint] NOT NULL,
	[data] [nvarchar](max) NULL,
	[scripts] [nvarchar](max) NULL,
	[enabled] [bit] NOT NULL,
	[tag] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[uid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

