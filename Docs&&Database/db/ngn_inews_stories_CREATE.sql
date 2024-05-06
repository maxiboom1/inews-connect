CREATE TABLE [dbo].[ngn_inews_stories](
	[uid] [bigint] IDENTITY(1,1) NOT NULL,
	[enabled] [bit] NOT NULL,
	[floating] [bit] NULL,
	[name] [nvarchar](32) NULL,
	[number] [nvarchar](8) NULL,
	[properties] [nvarchar](max) NULL,
	[production] [bigint] NOT NULL,
	[rundown] [bigint] NOT NULL,
	[lastupdate] [bigint] NOT NULL,
	[ord] [int] NOT NULL,
	[ordupdate] [bigint] NOT NULL,
	[tag] [nvarchar](max) NULL,
	[identifier] [nvarchar](8) NOT NULL,
	[locator] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[uid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
