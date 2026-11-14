# ASF Data Search Vertex

- **Source URL:** https://search.asf.alaska.edu/
- **Manual:** https://docs.asf.alaska.edu/vertex/manual/
- **ASF home:** https://asf.alaska.edu/
- **Priority for OrangHave / H.O.M.E.:** Utama
- **Relevance:** Platform utama unduh/cari SAR (Sentinel-1, NISAR L-band). Jalur konkret yang sudah diarahkan di `src/sources.js` / scraper ASF.

## Tentang ASF

Skip to content
Making remote sensing data accessible to advance Earth science and empower decision-makers worldwide
As integral part of the [link:https://www.gi.alaska.edu/] Geophysical Institute , we promote, facilitate, and participate in the advancement of remote sensing to support national and international Earth science research, field operations, and commercial applications.
[link:https://asf.alaska.edu/asf-data-product-finder/]
Datasets
[link:https://asf.alaska.edu/notices/changes-in-availability-of-historical-asf-datasets/]
[link:https://asf.alaska.edu/notices/changes-in-availability-of-historical-asf-datasets/] Changes in Availability of Historical ASF Datasets
October 1, 2026
[link:https://asf.alaska.edu/dynamic-planet/]
ASF Products & Platforms
Remote sensing data is a powerful tool for observing and understanding Earth processes.  At ASF our teams work continuously to streamline data discovery and processing for a broad range of users all over the world. [link:https://asf.alaska.edu/services/] Explore our tools for data discovery and processing at hyperspeed.
Data Discovery
Discover a world of remote sensing data through ASF’s tools:
Vertex, asf_search, and Search API
HyP3 Service
HyP3 is ASF’s flagship on-demand service that turns your Sentinel-1 SAR data into analysis-ready products.
OpenScienceLab & OpenSARLab
Open the door to the world of remote sensing data  processing in the cloud via a JupyterLab environment with OSL.
Notice Content from the ASF DAAC website will be moving to a new NASA website (earthdata.nasa.gov) from now until the end of 2026. During this process links are redirected in stages. Thank you for your patience as we make this transition. Can't find what you need? Contact us at [email protected] .
Ground Station Services at a Prime Location
ASF is at the forefront of satellite data services. We provide critical real-time data and analytics to a global community of researchers, government agencies, and commercial users. By leveraging our unique geographic position and cutting-edge technology, we ensure the reliable capture and distribution of satellite information, making it an essential asset for scientific and operational efforts worldwide. [link:https://asf.alaska.edu/asf-satellite-tracking-station/] Learn more about the ASF and NASA Ground Station.
35 years creating solutions to better understand our world
Since 1991, ASF has served as a vital connection between Earth-observing satellites and user communities worldwide. With our high-latitude Alaska location and a team of highly trained and experienced engineers and scientists, we offer a range of services to fulfill ASF’s mission to facilitate and participate in the use of remote sensing to support national and international Earth science research, disaster response, and commercial applications. Explore our history through the interactive timeline.
[link:https://www.earthdata.nasa.gov/centers/asf-daac/news] Notices
[link:https://asf.alaska.edu/notices/changes-in-availability-of-historical-asf-datasets/] Read More »
[link:https://asf.alaska.edu/notices/nisar-l-band-data-now-publicly-available/]
[link:https://asf.alaska.edu/notices/nisar-l-band-data-now-publicly-available/] NISAR L-Band Data Now Publicly Available
[link:https://asf.alaska.edu/notices/nisar-l-band-data-now-publicly-available/] Read More »
[link:https://www.earthdata.nasa.gov/centers/asf-daac/learn] Training

… (truncated for length; see source URL)

## Vertex — Getting Started (manual)

Skip to content
Vertex Getting Started User Guide #
If you do not already have one, create a free [link:https://urs.earthdata.nasa.gov/users/new] Earthdata Login account .
Go to [link:https://search.asf.alaska.edu] Vertex
Log in by clicking the Sign in icon in the top right of the window. Use your Earthdata Login username and password.
Search Type allows you to choose between all available search types.
Language Options #
In the top right menu, next to the Sign In icon, there are language control options. Vertex currently offers English and Spanish. If your browser is set to one of the available languages, Vertex will default to that language. You may click the button and select your desired language from the drop down list. You may also set a default language in your Preferences .
Geographic Search Options #
In the top left corner of the map, there are buttons that allow you to change your map view , zoom , and layers .
By default, the map is in equatorial projection. You may click Map View and select Arctic map view or Antarctic map view to change your map projection. Click Equatorial map view to switch back to the equatorial projection.
You may click the Zoom In or Zoom Out icons to adjust your zoom.
The default map layer is satellite. You may click the Layers button and select Satellite View or Street View to switch your map layer.
You may click Overview Map to add an overview map in the top right corner of the map. Click it again to turn off the overview map.
You may click Coherence Layer to select a seasonal coherence layer. Click the bubble next to the season you would like to turn on. Click the Coherence Layer checkbox again to turn the layer off.
You may click Gridlines to add a graticule overlay to the map. Click it again to turn off the overlay. Note : This is currently only available in the equatorial map view.
You may click Opacity and adjust the slider as desired to change the opacity of browse images displayed on the map. If the Coherence Layer is on, you may also adjust the opacity of that layer.
Navigate to your area of interest by dragging the map while holding down the left mouse button.
By default, the map-drawing tool is a bounding box. Click on the map once to specify the starting corner, move the mouse, then click again to finish the box. Additional drawing tool options are available in the toolbar at the top of the screen, including point , linestring , and polygon options.
Point allows you to define an area of interest by clicking on the map to place a point.
Line allows you to define an area of interest over a series of line segments by clicking on the map multiple times. Double-click to stop adding segments.
Polygon allows you to define an area of interest over an arbitrary polygon. You will receive an error message at the bottom of the window if there was a problem with the polygon (self-intersecting, reversed polygon winding order, etc.).
Box allows you to define an area of interest over a lat/long-aligned bounding box by clicking once to set one corner, and again to set the opposite corner.
Circle allows you to define an area of interest over an arbitrary circle. Click and drag to select your circle. Click again to stop drawing.
Once a shape has been drawn, select the Edit current area of interest icon on the toolbar to move, add, and delete points. Select the Draw new area of interest icon to create a new AOI.
Clicking Upload Goespatial File brings up the Area of Interest dialog window. You may enter a WKT string, upload a geospatial file, or enter a location.
Dataset enables you to choose the dataset of interest.
If you need more information about a particular dataset, click on the appropriate question mark icon in the Dataset selector.
Filters... enables you to further refine your search
Area of Interest Options #
Area of Interest gives you the option of entering a set of geographic coordinates, importing an area of interest as a geospatial file, or searching for a location. Click on the down arrow next to Area of Interest in the top menu.
An area of interest may be defined by a set of coordinates entered in the Area of Interest WKT window.
Coordinates should be entered as decimal degrees in well-known text (WKT) format. Coordinates entered as a comma-separated long/lat string (e.g. -97.38,36.46,-53.44,36.46...) will be automatically converted by Vertex to WKT format.
To upload a geospatial file, click Select Files and navigate to a folder on your computer, or drag and drop files into the box. GeoJSON , shapefiles , and KML files are supported provided they are in a latitude/longitude-based coordinate system, such as WGS84.
When importing a GeoJSON file, all geometries in the file will be included. If multiple geometries are found, a convex hull will be used to represent them in the search.
Shapefiles can be either a single .shp file, multiple shapefile components ( .shp, .shx, .dbf ), or a zip file containing one or more shapefile components. At a minimum, the .shp component must be included in all cases.
To enter a location, click the Search for a Location field, and start typing the name of the location. Select your desired location from the drop down list.
Once you have selected a location, it will be geocoded into WKT format coordinates.
You can save the coordinates of a search so they can be used to exactly recreate an area of interest in later searches.
Once the Area of Interest has been set, a Copy to clipboard icon will appear. Click on the icon and paste the coordinates into a new search or to a text file for later use.
Note: See the section Other Vertex Options for additional ways of saving searches.
At any time you can clear your search area by clicking on the Clear button.
Shape Validation #
If the AOI specified is its own Minimum Bounding Rectangle (MBR) in a mercator projection, the search results returned will instersect with the AOI in a mercator projection, regardless of width. This remains the case even if the international dateline is crossed within the AOI.
In order for an AOI to be considered its own MBR, it must meet the following criteria:
Each vertex shares a latitude or longitude with its neighbors
East/West points share longitude
North/South points share latitude
AOIs that do not fit this criteria will have their points connected along [link:https://en.wikipedia.org/wiki/Great_circle] great circles .
In addition, all AOIs are validated, and then simplified as needed. The process for this is:
Validate the input AOI. If it is not valid, an error is displayed.
Merge overlapping shapes.
Convex hull.
Any out-of-range index values are handled by clamping and wrapping them to the valid range of values.
Simplify points based on proximity threshold. The target is fewer than 400 points.
Each of these steps is performed only when necessary to get the AOI to a single outline with fewer than 400 points. Any unnecessary steps are skipped.
Examples of validation and simplification:
A self-intersecting polygon is provided:
An error is displayed.
A single outline is provided, consisting of 1000 points:
A simplified version of the same outline is used, consisting of fewer than 400 points.
Multiple geometries are provided, all of them overlapping at least in part:
A single outline is returned, representing the outline of all the shapes combined.
Multiple geometries are provided, at least some of them entirely non-overlapping:
A single outline is returned, representing the convex hull of all the shapes together.
Date Filters #
Date Filters Search dates are optional, so they default to empty. If you are searching for specific dates, you can define the date range further in the Start Date and End Date fields. The date picker will automatically constrain your selection to a valid range for the selected dataset.
Note : this information may also be found by clicking on the question mark icon for a dataset.
Seasonal Search allows constraining the search to certain annual periods within an overall range of dates. Click the Seasonal Search toggle and additional options will appear, allowing you to enter an overall date range ( Start Date/End Date ) and the seasonal range ( Season Start Day/Season End Day ).
Additional Filters #
Additional Filters allow for additional parameters to be applied to narrow your search and reduce the number of results. Not all filters will be available for all datasets.
File Type – Limit the search to specific types of files. Multiple selections allowed.
Beam Mode – Limit the search to specific beam modes. Multiple selections allowed.
Polarization – Limit the search to specific polarizations. Multiple selections allowed.
Direction – Limit the search to a specific orbit direction.
Subtype – Limit the search to a specific mission spacecraft.
Group ID – Limit the search to a specific group ID.
Burst ID – Limit the search to a specific burst ID. Multiple burst IDs allowed.
Standard Products or CalVal Products – Limit the search to either CalVal or Standard products. May choose one option. This selector is only available for the Opera-S1 dataset.
Campaign Selector – Limit the search to a specific campaign.
Product Filters #
Product Filters are available for the NISAR dataset.
Science Product - Specific product types, grouped by product level. Multiple selections allowed.
Production Configuration - Specific processing pipelines. Production uses the standard production system and is selected by default. Urgent Response is time-sensitive processing in response to urgent response events. Custom is user-initiated processing outside the nominal production system. Multiple selections are allowed.
Observational Filters #
Observational Filters are available for the NISAR dataset.
Main Band (Freq. A) Polarization - Frequency A polarizations. Multiple selections allowed.
Side Band (Freq. B) Polarization - Frequency B polarizations. Multiple selections allowed.
Direction – Orbit direction.
Instrument - Currently, only L-Band SAR is available.
Note: S-band data is available through [link:https://bhoonidhi.nrsc.gov.in/bhoonidhi/home.html] ISRO's Bhoonidhi
Frame Coverage - Full or Partial frame coverage.
Range Bandwidth - Range bandwidth in MHz. Some products have a range for both Main and Side band polarizations. These are listed as '[Main Band Bandwidth]+[Side Band Bandwidth]'. Multiple selections allowed.
Joint Observation Only - This toggle is defaulted to off. Toggle on for simultaneous L- and S-band acquisitions.
Path and Frame Filters #
Path and Frame Filters are available for select datasets. You may enter a single path or frame, or a range. Due to inconsistent Sentinel-1 framing, we recommend searching for a frame of interest by ±1-2 frames.
Note : For the NISAR dataset, path is called track.
Additional Search Options #
The maximum number of results is displayed below the SEARCH button. Click the down arrow to choose your preferred maximum results.
To clear all current search filters, click the down arrow next to the SEARCH button, then click Clear Search .
Once all parameters have been chosen, click SEARCH . Search results will appear in the footer area of the Vertex window and on the map.
Note : The number of files that are predicted to match the current search parameters is displayed under the SEARCH button. If there are no predicted matches, the search button will be greyed out and display NO RESULTS.
List Search Options #
Selecting List Search opens the List Search window and allows you to enter a list of scenes or file names.
Scene allows searching for specific scene names (granule names), and the results will include any files that are part of those scenes.
File allows searching for specific file names (product names), and the results will only include exactly those files.
Edit List opens the List Search window so you can make changes to your list
Once all parameters have been chosen, click SEARCH . Search results will appear in the footer area of your browser window and on the map.
List Search File Import #
You may drag and drop files into the box provided on the Scene or File tabs. Each tab lists the file types accepted at the bottom. Vertex will parse the scene or file names from your uploaded file.
Note : Each file type requires a specific format. Files exported from Vertex will have the correct format.
CSV requires a column labeled "Granule Name" for a scene list search. It requires an additonal "Processing Level" column for a file list search.
GeoJSON requires a field labeled "granuleName" for scene list search. It requires a field labeled "fileID" for file list search.
Metalink requires a structure formatted as
<metalink>
<files>
<file name="[Scene-Name.zip]"></file>
<file name ="...
...</file>
</files>
</metalink>
KML requires a structure formatted as
<kml>
<Document>
<Placemark>
<name>[Scene Name]</name>
</Placemark>
</Document>
</kml>
Baseline Search Options #
Selecting Baseline Search provides a space to enter the name of a Reference Scene, and will then search for all secondary scenes that match the coverage area of the Reference.
Note : If there are no matching scenes, the RESULTS button will be greyed out and will display NO RESULTS.
Once a Reference Scene has been entered, click SEARCH . Search results will appear under the map. Clicking on the Zoom to results icon at the top of the left results column will display the location of the stack of scenes on the map.
The graph displays the Temporal and Perpendicular (spatial) relationship of the secondary scenes to the Reference.
The Baseline Criteria... button allows you to specify additional criteria to refine your results, such as start and end dates, seasonal date settings, and temporal and perpendicular extents.
For further information on Baseline , please see the Baseline documentation .
SBAS Search Options #

… (truncated for length; see source URL)

## Sentinel-1 di ASF / Earthdata (dataset SAR operasional yang dipakai project)

Skip to main content
Earthdata Forum is down due to unplanned maintenance. Please contact earthdata-support@nasa.gov with questions. See the alert
Suomi NPP is no longer delivering new data. Users must transition to alternative products. Suomi NPP data announcement
Sentinel-1
Global, Repeat-Pass C-Band SAR Data Available
State: Operational
The Sentinels are a fleet of European Space Agency (ESA) satellites designed to acquire measurements from multiple sensor types that provide information necessary to meet Europe's Copernicus Program objectives.
The first mission in the series, the Sentinel-1 constellation, included twin satellites that each carried C-band synthetic aperture radar ( SAR ) and together provided all-weather, day-and-night imagery of Earth's surface. Sentinel-1A was launched in April 2014 and Sentinel-1B in April 2016. Their polar orbits were 180° apart, and together they had the potential to image Earth every six days.
In December 2021, an anomaly in Sentinel-1B's power supply caused the SAR instrument to stop working. Attempts to restore power to the sensor failed, and the mission officially ended on August 3, 2022.
Sentinel-1C was launched in December 2024, reestablishing a twin satellite constellation with extensive worldwide coverage and six-day repeat-pass observations.
Sentinel-1D was launched on November 4, 2025. After its commissioning phase, it will be maneuvered to replace Sentinel-1A. This is scheduled to occur during June 2026, after which Sentinel-1A operations will be terminated. Sentinel-1C and Sentinel-1D will then work in tandem and comprise the new Copernicus Sentinel-1 constellation.
The Sentinel-1 constellation supports numerous services, including monitoring Arctic sea-ice extent, routine sea-ice mapping, and surveillance of the marine environment. Applications include oil-spill monitoring and ship detection for maritime security; monitoring land surfaces for motion risks; mapping for forest, water, and soil management; and mapping to support humanitarian aid and crisis situations.
All products from the Sentinel-1 mission are available to download from NASA's Alaska Satellite Facility Distributed Active Archive Center ( ASF DAAC ) through the [link:https://search.asf.alaska.edu/] Vertex search application, programmatically using [link:https://docs.asf.alaska.edu/asf_search/basics/] asf_search and [link:https://docs.asf.alaska.edu/api/basics/] SearchAPI , and through [link:https://search.earthdata.nasa.gov/search?q=sentinel-1c] Earthdata Search .
[link:https://www.esa.int/missions/about-us/directorates/earth-observation-programmes/copernicus/sentinel-1] Learn more about Sentinel-1 from ESA
Data
121 Datasets
View Data and Tools
View data alert history
Type
Earth Observation Satellite
Objective
Land and Ocean Monitoring
Launch
Sentinel-1A - April 3, 2014
Sentinel-1B - April 25, 2016
Sentinel-1C - Dec. 5, 2024
Sentinel-1D - Nov. 4, 2025
Data Center
ASF DAAC
Featured Learning Resources
RTC On Demand
Work with radiometrically terrain corrected (RTC) Sentinel-1 synthetic aperture radar (SAR) datasets from NASA’s Alaska Satellite Facility Distributed Active Archive Center (ASF DAAC).
StoryMap
Nov. 11, 2020
InSAR On Demand
Order Sentinel-1 interferometric synthetic aperture radar (InSAR) datasets from NASA’s Alaska Satellite Facility Distributed Active Archive Center (ASF DAAC).
April 23, 2021
Sentinel-1 Bursts
Work with Sentinel-1 Burst products from NASA’s Alaska Satellite Facility Distributed Active Archive Center (ASF DAAC).
June 14, 2023
Burst-Based InSAR for Sentinel-1 On Demand
Order Sentinel-1 interferometric synthetic aperture radar (InSAR) products On Demand from NASA’s Alaska Satellite Facility Distributed Active Archive Center (ASF DAAC) for individual SLC bursts.
Nov. 1, 2024
Properties of Sentinel-1 acquisition modes
Property
[link:https://sentiwiki.copernicus.eu/web/s1-mission#S1-Mission-Stripmap] Strip Map (SM) mode
[link:https://sentiwiki.copernicus.eu/web/s1-mission#S1-Mission-Interferometric-Wide-Swath] Interferometric Wide (IW) mode 1
[link:https://sentiwiki.copernicus.eu/web/s1-mission#S1-Mission-Extra-Wide-Swath] Extra Wide (EW) mode 2
[link:https://sentiwiki.copernicus.eu/web/s1-mission#S1-Mission-Wave] Wave (WV) mode
Temporal Coverage
12 Days
Spatial Coverage
Global
Primary Use
High-resolution imaging
Land
Maritime/Sea ice
Open ocean
Center Frequency
C-band at 5.405 GHz
Polarization
Single Polarization (HH or VV)
Dual Polarization (HH+HV or VV+VH)
Spatial Resolution
5 x 5 m
5 x 20 m
20 x 40 m
Swath Width
80 km
250 km
410 km
100 km
Off-Nadir Angle
18.3° to 46.8°
29.1° to 46.0°
18.9° to 47.0°
21.6° to 45.1° and 34.8° to 38.0°
File format
SAFE
Provider
European Space Agency
Date published:
2014
1 Interferometric Wide Swath (IW)
Acquired with [link:https://sentiwiki.copernicus.eu/web/s1-processing#S1Processing-AlgorithmOverviewS1-Processing-Algorithm-Overview] TOPSAR
Three sub-swaths
250 km swath width
5 m x 20 m ground resolution
2 Extra Wide Swath (EW)
Five sub-swaths
410 km swath width
20 m x 40 m ground resolution
The naming convention used for a Sentinel-1 product file is diagrammed in Figure 1. For more information, see the SentiWiki [link:https://sentiwiki.copernicus.eu/web/s1-products#S1Products-SARNamingConventionS1-Products-SAR-Naming-Convention] S1 SAR Products Overview .
Image
[link:https://earthdata.nasa.gov/s3fs-public/2024-06/sentinel-1-granule-naming-convention-inline.png?VersionId=hYrLQKKn1git2x8JhRw9dfHli64CURbq]
Image Caption
Fig. 1 Sentinel-1 product file naming convention.
Sentinel-1 Cumulative Acquisition Maps
Two Cumulative Heat maps are updated monthly as new data are processed. One map displays the total coverage of Sentinel-1 Ground Range Detected (GRD) product data over the globe from 2014 to the last updated month in the current year, while the other map displays the total coverage of Sentinel-1 Single Look Complex (SLC) product data over the globe for the same time period. A color ramp indicates the number of times an area has been observed.
Current Cumulative: October 31, 2026
[link:https://earthdata.nasa.gov/s3fs-public/2026-11/GRD-Cumulative-2026-10-scaled.png?VersionId=Y4MEIHrfTQVcTqsAq25CMMYL79wGxHi9]
Sentinel-1 Level 1 GRD data coverage - cumulative through October 31, 2026
Sentinel-1 Monthly Acquisition Map
The monthly acquisition map shows the distribution of Sentinel-1 GRD products generated in the previous month. The number of products over an area is indicated by a color ramp.
[link:https://earthdata.nasa.gov/s3fs-public/2026-11/GRD-Monthly-2026-10-scaled_0.png?VersionId=XzYVT4eS9t9AusmXa9ysPZClJFtie7Lc]
Sentinel-1C and 1D Level 1 GRD data coverage - October 2026
[link:https://earthdata.nasa.gov/s3fs-public/2026-11/SLC-Cumulative-2026-10-scaled.png?VersionId=sF67PEN9Nnr89RtwDEl3XpiN_mNvKjrm]
Sentinel-1 Level 1 SLC data coverage - cumulative through October 31, 2026
Orbit and Auxiliary Data Files

… (truncated for length; see source URL)

## asf_search basics (docs)

Basics - ASF SAR Data Search Manual

 
 
 
 

 
 

 
 
 
 
 
 
 
 
 

 

 
 
 
 
 

 
 

 
 
 

 
 

 
 
 

 
 
 

 
 
 
 
 
 

 

 

 

 
 
 

 Skip to content
 

 
 

 

 
 

 
 
 

 

 

 

 

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to
 deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 IN THE SOFTWARE.
-->

 

 

 

 

 
 

 

 

 

 

 

 ASF SAR Data Search Manual
 

 

 

 

 
 Basics
 
 

 

 

 

 
 
 

 

 
 

 

 

 

 

 
 

 

 English
 

 

 
 

 

 Español
 

 

 
 

 

 

 
 
 
 

 

 
 

 
 
 
 
 
 
 

 

 
 
 
 

 

 

 

 

 

 

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to
 deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 IN THE SOFTWARE.
-->

 

 

 ASF SAR Data Search Manual
 

 
 

 
 
 
 
 
 
 

 

 
 
 

 Home
 

 

 

 

 

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 

 
 

 
 
 

 Vertex
 

 

 

 

 
 

 

 

 Vertex
 

 

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 

 
 

 
 
 

 Vertex Manual
 

 

 

 

 
 

 

 

 Vertex Manual
 

 

 
 
 
 
 
 
 

 

 
 
 

 Vertex Getting Started User Guide
 

 

 

 

 

 
 
 

 

 
 

 

 
 
 
 
 
 
 
 

 

 
 
 

 Baseline
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 SBAS
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 Displacement
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 Event
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 Derived Datasets
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 What's New
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 Wildcard Queries
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 Tutorial Videos
 

 

 

 

 

 
 
 
 
 
 
 
 

 

 
 
 

 Source Code
 

 

 

 

 

 
 
 

 

 
 

 

 
 
 
 
 
 
 

 

 
 
 

 Custom Processing
 

 

 

 

 

 
 
 
 
 
 
 
 
 
 
 
 

 


## Catatan untuk project

- Cari Sentinel-1 IW over Kalimantan untuk layer SAR / burned-area context.
- NISAR filter di Vertex: dataset NISAR, product filters (GCOV penting untuk ekosistem/gangguan hutan).
- Programmatic: `asf_search` Python package + Search API.
- HyP3: on-demand RTC / InSAR dari Sentinel-1.
